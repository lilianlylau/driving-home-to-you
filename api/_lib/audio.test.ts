import { describe, expect, it } from 'vitest'
import { inspectAudio, MAX_VOICE_BYTES } from './audio'

function wav(durationSeconds: number) {
  const byteRate = 8_000
  const size = byteRate * durationSeconds
  const data = Buffer.alloc(44 + size)
  data.write('RIFF')
  data.writeUInt32LE(36 + size, 4)
  data.write('WAVE', 8)
  data.write('fmt ', 12)
  data.writeUInt32LE(16, 16)
  data.writeUInt16LE(1, 20)
  data.writeUInt16LE(1, 22)
  data.writeUInt32LE(8_000, 24)
  data.writeUInt32LE(byteRate, 28)
  data.writeUInt16LE(1, 32)
  data.writeUInt16LE(8, 34)
  data.write('data', 36)
  data.writeUInt32LE(size, 40)
  return data
}

describe('voice inspection', () => {
  it('derives duration from the uploaded container', () => {
    expect(inspectAudio(wav(2), 'audio/wav')).toMatchObject({ durationMs: 2000, extension: 'wav' })
  })

  it('rejects mismatched, oversized, and overlong recordings', () => {
    expect(() => inspectAudio(Buffer.from('not wave'), 'audio/wav')).toThrow(
      'could not be verified',
    )
    expect(() => inspectAudio(Buffer.alloc(MAX_VOICE_BYTES + 1), 'audio/wav')).toThrow('5 MB')
    expect(() => inspectAudio(wav(121), 'audio/wav')).toThrow('two minutes')
  })
})
