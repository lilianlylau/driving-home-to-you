import { z } from 'zod'
import { ApiError } from './http'

const safeText = (maximum: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maximum)
    .refine(
      (value) =>
        !Array.from(value).some((character) => {
          const point = character.codePointAt(0) ?? 0
          return (point < 32 && point !== 9 && point !== 10 && point !== 13) || point === 127
        }),
      'control characters are not allowed',
    )
const httpsUrl = z
  .string()
  .url()
  .max(2048)
  .refine((value) => new URL(value).protocol === 'https:', 'must use HTTPS')
const appleMediaUrl = httpsUrl.refine((value) => {
  const host = new URL(value).hostname
  return (
    host === 'itunes.apple.com' ||
    host.endsWith('.itunes.apple.com') ||
    host.endsWith('.mzstatic.com')
  )
}, 'must be an Apple media URL')
const songSchema = z
  .object({
    id: safeText(100),
    title: safeText(200),
    artist: safeText(200),
    audioUrl: appleMediaUrl,
    albumArtUrl: appleMediaUrl.optional(),
  })
  .strict()

export const createDriveSchema = z
  .object({
    noteText: safeText(500),
    songs: z.array(songSchema).min(1).max(3),
    challengeToken: z.string().max(4096).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set(value.songs.map((song) => song.id))
    if (ids.size !== value.songs.length)
      context.addIssue({ code: 'custom', path: ['songs'], message: 'songs must be unique' })
  })

export const shortIdSchema = z.string().regex(/^[A-Za-z0-9_-]{12,32}$/u)
export const deleteSchema = z.object({ deletionToken: z.string().min(40).max(100) }).strict()

export function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input)
  if (!parsed.success) throw new ApiError(400, 'invalid_request', 'request contains invalid data')
  return parsed.data
}
