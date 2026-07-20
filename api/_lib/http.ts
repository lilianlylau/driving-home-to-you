import type { IncomingMessage, ServerResponse } from 'node:http'

export const MAX_JSON_BYTES = 64 * 1024
export const MAX_MULTIPART_BYTES = 5 * 1024 * 1024 + 128 * 1024

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfter?: number,
  ) {
    super(message)
  }
}

export function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

export function sendError(response: ServerResponse, error: unknown) {
  const safe =
    error instanceof ApiError ? error : new ApiError(500, 'internal_error', 'something went wrong')
  if (safe.retryAfter) response.setHeader('Retry-After', String(safe.retryAfter))
  sendJson(response, safe.status, { code: safe.code, message: safe.message })
}

export async function readBody(request: IncomingMessage, maximum: number): Promise<Buffer> {
  const length = Number(request.headers['content-length'] ?? 0)
  if (length > maximum) throw new ApiError(413, 'request_too_large', 'request is too large')
  const chunks: Buffer[] = []
  let size = 0
  for await (const value of request) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
    size += chunk.length
    if (size > maximum) throw new ApiError(413, 'request_too_large', 'request is too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export async function parseJson(
  request: IncomingMessage,
  maximum = MAX_JSON_BYTES,
): Promise<unknown> {
  try {
    return JSON.parse((await readBody(request, maximum)).toString('utf8'))
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(400, 'invalid_json', 'request body must be valid JSON')
  }
}

export function requireMethod(
  request: IncomingMessage,
  response: ServerResponse,
  methods: string[],
) {
  if (request.method && methods.includes(request.method)) return
  response.setHeader('Allow', methods.join(', '))
  throw new ApiError(405, 'method_not_allowed', `use ${methods.join(' or ')}`)
}
