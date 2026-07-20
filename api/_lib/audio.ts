import { ApiError } from './http'

export const MAX_VOICE_BYTES = 5 * 1024 * 1024
export const MAX_VOICE_DURATION_MS = 120_000
export const VOICE_MIME_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'] as const
export type VoiceMimeType = (typeof VOICE_MIME_TYPES)[number]

function webmDuration(data: Buffer) {
  for (let i = 0; i < data.length - 6; i += 1) {
    if (data[i] !== 0x44 || data[i + 1] !== 0x89) continue
    const size = data[i + 2]
    if (size === 0x84) return data.readFloatBE(i + 3)
    if (size === 0x88) return data.readDoubleBE(i + 3)
  }
}

function oggDuration(data: Buffer) {
  let offset = 0
  let lastGranule = 0n
  while ((offset = data.indexOf('OggS', offset, 'ascii')) >= 0 && offset + 14 <= data.length) {
    lastGranule = data.readBigUInt64LE(offset + 6)
    offset += 4
  }
  if (lastGranule > 0n) return Number(lastGranule) / 48
}

function wavDuration(data: Buffer) {
  if (data.length < 44) return
  const byteRate = data.readUInt32LE(28)
  const dataIndex = data.indexOf('data', 36, 'ascii')
  if (!byteRate || dataIndex < 0 || dataIndex + 8 > data.length) return
  return (data.readUInt32LE(dataIndex + 4) / byteRate) * 1000
}

function mp4Duration(data: Buffer) {
  const index = data.indexOf('mvhd', 0, 'ascii')
  if (index < 0 || index + 24 > data.length) return
  const version = data[index + 4]
  const base = index + (version === 1 ? 24 : 16)
  if (base + (version === 1 ? 12 : 8) > data.length) return
  const timescale = data.readUInt32BE(base)
  const duration =
    version === 1 ? Number(data.readBigUInt64BE(base + 4)) : data.readUInt32BE(base + 4)
  if (timescale) return (duration / timescale) * 1000
}

export function inspectAudio(
  data: Buffer,
  mimeType: string,
): { mimeType: VoiceMimeType; durationMs: number; extension: string } {
  if (data.length === 0 || data.length > MAX_VOICE_BYTES)
    throw new ApiError(400, 'invalid_voice', 'voice memo must be no larger than 5 MB')
  if (!VOICE_MIME_TYPES.includes(mimeType as VoiceMimeType))
    throw new ApiError(400, 'invalid_voice_type', 'voice memo format is not supported')
  let duration: number | undefined
  let valid = false
  let extension = ''
  if (mimeType === 'audio/webm') {
    valid = data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
    duration = webmDuration(data)
    extension = 'webm'
  }
  if (mimeType === 'audio/ogg') {
    valid = data.subarray(0, 4).toString('ascii') === 'OggS'
    duration = oggDuration(data)
    extension = 'ogg'
  }
  if (mimeType === 'audio/wav') {
    valid =
      data.subarray(0, 4).toString('ascii') === 'RIFF' &&
      data.subarray(8, 12).toString('ascii') === 'WAVE'
    duration = wavDuration(data)
    extension = 'wav'
  }
  if (mimeType === 'audio/mp4') {
    valid = data.subarray(4, 12).includes(Buffer.from('ftyp'))
    duration = mp4Duration(data)
    extension = 'm4a'
  }
  if (!valid || !duration || !Number.isFinite(duration) || duration <= 0)
    throw new ApiError(400, 'invalid_voice', 'voice memo could not be verified')
  if (duration > MAX_VOICE_DURATION_MS)
    throw new ApiError(400, 'voice_too_long', 'voice memo must be two minutes or less')
  return { mimeType: mimeType as VoiceMimeType, durationMs: Math.ceil(duration), extension }
}
