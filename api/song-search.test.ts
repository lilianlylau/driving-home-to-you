import { describe, expect, it } from 'vitest'
import { normalizeITunesResults } from './song-search'

describe('iTunes normalization', () => {
  it('returns only complete songs in the public Song shape', () => {
    expect(
      normalizeITunesResults({
        results: [
          {
            kind: 'song',
            trackId: 1,
            trackName: 'Dreams',
            artistName: 'The Cranberries',
            previewUrl: 'https://audio.test/dreams',
            trackViewUrl: 'https://music.apple.com/ca/song/dreams/1',
            artworkUrl100: 'https://image.test/dreams',
            collectionName: 'Everybody Else Is Doing It',
          },
          {
            kind: 'song',
            trackId: 2,
            trackName: 'Silent',
            artistName: 'Artist',
            trackViewUrl: 'https://music.apple.com/ca/song/silent/2',
          },
        ],
      }),
    ).toEqual([
      {
        id: '1',
        title: 'Dreams',
        artist: 'The Cranberries',
        audioUrl: 'https://audio.test/dreams',
        albumArtUrl: 'https://image.test/dreams',
      },
    ])
  })
})
