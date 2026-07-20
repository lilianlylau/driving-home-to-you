import type { IncomingMessage, ServerResponse } from 'node:http'
import { inspectAudio } from '../_lib/audio'
import { createDrive } from '../_lib/drives'
import {
  ApiError,
  MAX_JSON_BYTES,
  MAX_MULTIPART_BYTES,
  parseJson,
  readBody,
  requireMethod,
  sendError,
  sendJson,
} from '../_lib/http'
import { takeRateLimit } from '../_lib/rate-limit'
import { clientHash, globalRateKey, verifyBotChallenge } from '../_lib/security'
import { getServerSupabase } from '../_lib/supabase'
import { createDriveSchema, validate } from '../_lib/validation'

async function parseCreateRequest(request: IncomingMessage) {
  const contentType = request.headers['content-type'] ?? ''
  if (contentType.startsWith('application/json'))
    return {
      input: validate(createDriveSchema, await parseJson(request, MAX_JSON_BYTES)),
      voice: undefined,
    }
  if (!contentType.startsWith('multipart/form-data'))
    throw new ApiError(415, 'unsupported_media_type', 'use JSON or multipart form data')
  const body = await readBody(request, MAX_MULTIPART_BYTES)
  const webRequest = new Request('http://localhost', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  })
  let form: FormData
  try {
    form = await webRequest.formData()
  } catch {
    throw new ApiError(400, 'invalid_form', 'multipart form data is invalid')
  }
  const payload = form.get('payload')
  if (typeof payload !== 'string' || payload.length > MAX_JSON_BYTES)
    throw new ApiError(400, 'invalid_request', 'payload is required')
  let input: unknown
  try {
    input = JSON.parse(payload)
  } catch {
    throw new ApiError(400, 'invalid_json', 'payload must be valid JSON')
  }
  const file = form.get('voice')
  if (file !== null && !(file instanceof File))
    throw new ApiError(400, 'invalid_voice', 'voice memo is invalid')
  const voiceData = file ? Buffer.from(await file.arrayBuffer()) : undefined
  const voice =
    file && voiceData ? { data: voiceData, ...inspectAudio(voiceData, file.type) } : undefined
  return { input: validate(createDriveSchema, input), voice }
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  try {
    requireMethod(request, response, ['POST'])
    const secret = process.env.API_HASH_SECRET
    if (!secret || secret.length < 32)
      throw new ApiError(503, 'service_unavailable', 'service is not configured')
    const configuredOrigin = process.env.PUBLIC_APP_URL
    if (!configuredOrigin)
      throw new ApiError(503, 'service_unavailable', 'service is not configured')
    const origin = configuredOrigin.replace(/\/$/u, '')
    const client = getServerSupabase()
    const key = clientHash(request, secret)
    await takeRateLimit(client, 'global_create', globalRateKey(), 3600, 100)
    const rate = await takeRateLimit(client, 'client_create', key, 3600, 10)
    const { input, voice } = await parseCreateRequest(request)
    if (rate.request_count > 3) await verifyBotChallenge(input.challengeToken, undefined)
    const result = await createDrive(client, input, voice, secret)
    sendJson(response, 201, { ...result, shareUrl: `${origin}/drive/${result.shortId}` })
  } catch (error) {
    sendError(response, error)
  }
}
