import { describe, expect, it } from 'vitest'
import { createDriveSchema } from './validation'

const song = {
  id: '42',
  title: 'Home',
  artist: 'Artist',
  audioUrl: 'https://audio-ssl.itunes.apple.com/home.m4a',
}

describe('drive validation', () => {
  it('trims content and accepts one to three unique songs', () => {
    expect(createDriveSchema.parse({ noteText: ' hello ', songs: [song] }).noteText).toBe('hello')
  })

  it('rejects duplicate tracks and unsafe or invalid content', () => {
    expect(createDriveSchema.safeParse({ noteText: 'hello', songs: [song, song] }).success).toBe(
      false,
    )
    expect(createDriveSchema.safeParse({ noteText: ' ', songs: [song] }).success).toBe(false)
    expect(createDriveSchema.safeParse({ noteText: 'hello\u0000', songs: [song] }).success).toBe(
      false,
    )
    expect(
      createDriveSchema.safeParse({
        noteText: 'hello',
        songs: [{ ...song, audioUrl: 'http://audio.test/x' }],
      }).success,
    ).toBe(false)
  })
})
