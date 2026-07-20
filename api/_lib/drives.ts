import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiError } from './http'
import {
  generateDeleteToken,
  generateShortId,
  hashDeleteToken,
  SHORT_ID_ATTEMPTS,
  tokensMatch,
} from './security'
import type { createDriveSchema } from './validation'
import type { z } from 'zod'

export const VOICE_BUCKET = 'voice-memos'
type Input = z.infer<typeof createDriveSchema>
interface Voice {
  data: Buffer
  mimeType: string
  durationMs: number
  extension: string
}

function isCollision(error: { code?: string; message?: string } | null) {
  return error?.code === '23505' && (error.message?.includes('short_id') ?? false)
}

export async function createDrive(
  client: SupabaseClient,
  input: Input,
  voice: Voice | undefined,
  tokenSecret: string,
) {
  const deletionToken = generateDeleteToken()
  const tokenHash = hashDeleteToken(deletionToken, tokenSecret)
  const voicePath = voice ? `${randomUUID()}.${voice.extension}` : undefined
  if (voice && voicePath) {
    const { error } = await client.storage
      .from(VOICE_BUCKET)
      .upload(voicePath, voice.data, { contentType: voice.mimeType, upsert: false })
    if (error) throw new ApiError(502, 'voice_upload_failed', 'voice memo could not be uploaded')
  }
  try {
    for (let attempt = 0; attempt < SHORT_ID_ATTEMPTS; attempt += 1) {
      const shortId = generateShortId()
      const songs = input.songs.map((song, position) => ({
        position,
        source_track_id: song.id,
        title: song.title,
        artist: song.artist,
        preview_url: song.audioUrl,
        artwork_url: song.albumArtUrl ?? null,
      }))
      const { error } = await client.rpc('create_drive_with_songs', {
        p_short_id: shortId,
        p_note_text: input.noteText,
        p_voice_object_path: voicePath ?? null,
        p_voice_duration_ms: voice?.durationMs ?? null,
        p_delete_token_hash: tokenHash,
        p_songs: songs,
      })
      if (!error) return { shortId, deletionToken }
      if (!isCollision(error))
        throw new ApiError(502, 'drive_creation_failed', 'drive could not be created')
    }
    throw new ApiError(503, 'id_generation_failed', 'drive could not be created')
  } catch (error) {
    if (voicePath) await client.storage.from(VOICE_BUCKET).remove([voicePath])
    throw error
  }
}

export async function readDrive(client: SupabaseClient, shortId: string) {
  const { data, error } = await client
    .from('drives')
    .select(
      'id, short_id, note_text, voice_object_path, created_at, drive_songs(position, source_track_id, title, artist, preview_url, artwork_url)',
    )
    .eq('short_id', shortId)
    .is('deleted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (error) throw new ApiError(502, 'drive_read_failed', 'drive could not be loaded')
  if (!data)
    throw new ApiError(404, 'drive_not_found', "sorry we couldn't find your mixtape and letter")
  const row = data as unknown as {
    short_id: string
    note_text: string
    voice_object_path: string | null
    created_at: string
    drive_songs: Array<{
      position: number
      source_track_id: string
      title: string
      artist: string
      preview_url: string
      artwork_url: string | null
    }>
  }
  let voiceMemoUrl: string | undefined
  if (row.voice_object_path) {
    const { data: signed, error: signError } = await client.storage
      .from(VOICE_BUCKET)
      .createSignedUrl(row.voice_object_path, 300)
    if (signError)
      throw new ApiError(502, 'voice_url_failed', 'voice memo is temporarily unavailable')
    voiceMemoUrl = signed.signedUrl
  }
  return {
    shortId: row.short_id,
    noteText: row.note_text,
    createdAt: row.created_at,
    songs: row.drive_songs
      .sort((a, b) => a.position - b.position)
      .map((song) => ({
        id: song.source_track_id,
        title: song.title,
        artist: song.artist,
        audioUrl: song.preview_url,
        ...(song.artwork_url ? { albumArtUrl: song.artwork_url } : {}),
      })),
    ...(voiceMemoUrl ? { voiceMemoUrl } : {}),
  }
}

export async function deleteDrive(
  client: SupabaseClient,
  shortId: string,
  token: string,
  tokenSecret: string,
) {
  const { data, error } = await client
    .from('drives')
    .select('delete_token_hash')
    .eq('short_id', shortId)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw new ApiError(502, 'drive_delete_failed', 'drive could not be deleted')
  const row = data as { delete_token_hash: string } | null
  if (!row || !tokensMatch(row.delete_token_hash, token, tokenSecret))
    throw new ApiError(404, 'drive_not_found', "sorry we couldn't find your mixtape and letter")
  const { error: updateError } = await client
    .from('drives')
    .update({ deleted_at: new Date().toISOString() })
    .eq('short_id', shortId)
    .is('deleted_at', null)
  if (updateError) throw new ApiError(502, 'drive_delete_failed', 'drive could not be deleted')
}
