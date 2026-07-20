import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { ApiError } from './http'

export const SHORT_ID_ATTEMPTS = 5

export function generateShortId() {
  return randomBytes(9).toString('base64url')
}

export function generateDeleteToken() {
  return randomBytes(32).toString('base64url')
}

export function hashDeleteToken(token: string, secret: string) {
  return createHmac('sha256', secret).update(token).digest('hex')
}

export function tokensMatch(actualHash: string, token: string, secret: string) {
  const expected = Buffer.from(actualHash, 'hex')
  const actual = Buffer.from(hashDeleteToken(token, secret), 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function clientHash(request: IncomingMessage, secret: string) {
  const forwarded = request.headers['x-forwarded-for']
  const raw =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ||
    request.socket.remoteAddress ||
    'unknown'
  return createHmac('sha256', secret).update(raw).digest('hex')
}

export function globalRateKey() {
  return createHash('sha256').update('all-clients').digest('hex')
}

export async function verifyBotChallenge(token: string | undefined, clientIp: string | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret)
    throw new ApiError(503, 'challenge_unavailable', 'creation is temporarily unavailable')
  if (!token) throw new ApiError(403, 'challenge_required', 'please complete the bot challenge')
  const body = new URLSearchParams({ secret, response: token })
  if (clientIp) body.set('remoteip', clientIp)
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(5_000),
  })
  const payload = (await result.json()) as { success?: boolean }
  if (!result.ok || payload.success !== true)
    throw new ApiError(403, 'challenge_failed', 'bot challenge could not be verified')
}
