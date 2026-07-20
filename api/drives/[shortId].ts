import type { IncomingMessage, ServerResponse } from 'node:http'
import { deleteDrive, readDrive } from '../_lib/drives'
import { ApiError, parseJson, requireMethod, sendError, sendJson } from '../_lib/http'
import { takeRateLimit } from '../_lib/rate-limit'
import { clientHash } from '../_lib/security'
import { getServerSupabase } from '../_lib/supabase'
import { deleteSchema, shortIdSchema, validate } from '../_lib/validation'

function pathShortId(request: IncomingMessage) {
  const raw = new URL(request.url ?? '/', 'http://localhost').pathname
    .split('/')
    .filter(Boolean)
    .at(-1)
  const result = shortIdSchema.safeParse(raw)
  if (!result.success)
    throw new ApiError(404, 'drive_not_found', "sorry we couldn't find your mixtape and letter")
  return result.data
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  try {
    requireMethod(request, response, ['GET', 'DELETE'])
    const secret = process.env.API_HASH_SECRET
    if (!secret || secret.length < 32)
      throw new ApiError(503, 'service_unavailable', 'service is not configured')
    const client = getServerSupabase()
    const shortId = pathShortId(request)
    const scope = request.method === 'GET' ? 'client_read' : 'client_delete'
    await takeRateLimit(
      client,
      scope,
      clientHash(request, secret),
      60,
      request.method === 'GET' ? 120 : 20,
    )
    if (request.method === 'GET') {
      sendJson(response, 200, await readDrive(client, shortId))
      return
    }
    const { deletionToken } = validate(deleteSchema, await parseJson(request))
    await deleteDrive(client, shortId, deletionToken, secret)
    sendJson(response, 200, { deleted: true })
  } catch (error) {
    sendError(response, error)
  }
}
