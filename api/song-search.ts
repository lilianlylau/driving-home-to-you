import type { IncomingMessage, ServerResponse } from 'node:http'
import { z } from 'zod'

const querySchema = z.string().trim().min(2).max(100)
export const ITUNES_RESULT_LIMIT = 12
const ITUNES_TIMEOUT_MS = 5_000

const iTunesResultSchema = z.object({
  kind: z.string().optional(),
  trackId: z.number().int().positive().optional(),
  trackName: z.string().min(1).max(500).optional(),
  artistName: z.string().min(1).max(500).optional(),
  previewUrl: z.string().url().optional(),
  trackViewUrl: z.string().url().optional(),
  artworkUrl100: z.string().url().optional(),
})

const iTunesResponseSchema = z.object({ results: z.array(iTunesResultSchema).default([]) })

export function normalizeITunesResults(payload: unknown) {
  const parsed = iTunesResponseSchema.parse(payload)
  return parsed.results
    .flatMap((result) => {
      if (
        result.kind !== 'song' ||
        result.trackId === undefined ||
        result.trackName === undefined ||
        result.artistName === undefined ||
        result.previewUrl === undefined ||
        result.trackViewUrl === undefined
      ) {
        return []
      }
      return [
        {
          id: String(result.trackId),
          title: result.trackName,
          artist: result.artistName,
          audioUrl: result.previewUrl,
          ...(result.artworkUrl100 ? { albumArtUrl: result.artworkUrl100 } : {}),
        },
      ]
    })
    .slice(0, ITUNES_RESULT_LIMIT)
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600')
  response.end(JSON.stringify(body))
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { code: 'method_not_allowed', message: 'use GET to search songs' })
    return
  }

  const url = new URL(request.url ?? '/', 'http://localhost')
  const parsedQuery = querySchema.safeParse(url.searchParams.get('term'))
  if (!parsedQuery.success) {
    sendJson(response, 400, { code: 'invalid_query', message: 'enter 2 to 100 characters' })
    return
  }

  try {
    const appleUrl = new URL('https://itunes.apple.com/search')
    appleUrl.searchParams.set('term', parsedQuery.data)
    appleUrl.searchParams.set('media', 'music')
    appleUrl.searchParams.set('entity', 'song')
    appleUrl.searchParams.set('limit', String(ITUNES_RESULT_LIMIT))
    appleUrl.searchParams.set('country', 'ca')
    const upstream = await fetch(appleUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(ITUNES_TIMEOUT_MS),
    })
    if (!upstream.ok) throw new Error(`Apple returned ${upstream.status}`)
    sendJson(response, 200, { results: normalizeITunesResults(await upstream.json()) })
  } catch {
    sendJson(response, 502, {
      code: 'song_search_unavailable',
      message: 'song search is temporarily unavailable',
    })
  }
}
