import { z } from 'zod'
import type { Song } from '../types/domain'

const songSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  audioUrl: z.string(),
  albumArtUrl: z.string().optional(),
})

const responseSchema = z.object({ results: z.array(songSchema).max(12) })

export const MIN_SONG_QUERY_LENGTH = 2
export const MAX_SONG_QUERY_LENGTH = 100

export async function searchSongs(query: string, signal?: AbortSignal): Promise<Song[]> {
  const normalizedQuery = query.trim().slice(0, MAX_SONG_QUERY_LENGTH)
  if (normalizedQuery.length < MIN_SONG_QUERY_LENGTH) return []

  const response = await fetch(`/api/song-search?term=${encodeURIComponent(normalizedQuery)}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('song search failed')
  return responseSchema.parse(await response.json()).results
}
