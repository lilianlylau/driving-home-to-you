import { beforeEach, describe, expect, it } from 'vitest'
import {
  DRAFT_STORAGE_KEY,
  initialDraft,
  isValidNote,
  isValidSongSelection,
  useDraftStore,
} from './draft'
import type { Song } from '../types/domain'

const song = (id: string): Song => ({
  id,
  title: `song ${id}`,
  artist: 'artist',
  audioUrl: `https://example.com/${id}.mp3`,
})

describe('creator draft store', () => {
  beforeEach(() => {
    localStorage.clear()
    useDraftStore.setState(initialDraft)
  })

  it('validates songs and trimmed letter content', () => {
    expect(isValidSongSelection([])).toBe(false)
    expect(isValidSongSelection([song('1')])).toBe(true)
    expect(isValidSongSelection([song('1'), song('1')])).toBe(false)
    expect(isValidSongSelection([song('1'), song('2'), song('3'), song('4')])).toBe(false)
    expect(isValidNote('   ')).toBe(false)
    expect(isValidNote(' hello ')).toBe(true)
    expect(isValidNote('x'.repeat(501))).toBe(false)
  })

  it('rejects duplicate songs and a fourth song', () => {
    expect(useDraftStore.getState().addSong(song('1'))).toBe(true)
    expect(useDraftStore.getState().addSong(song('1'))).toBe(false)
    expect(useDraftStore.getState().addSong(song('2'))).toBe(true)
    expect(useDraftStore.getState().addSong(song('3'))).toBe(true)
    expect(useDraftStore.getState().addSong(song('4'))).toBe(false)
    expect(useDraftStore.getState().songs.map(({ id }) => id)).toEqual(['1', '2', '3'])
  })

  it('persists serializable state and rehydrates playback paused', async () => {
    useDraftStore.setState({
      songs: [song('1')],
      noteText: 'hello',
      currentStep: 3,
      player: { activeTrackId: '1', positionSeconds: 19, isPlaying: true },
    })
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
    expect(saved).not.toContain('Blob')
    useDraftStore.setState(initialDraft)
    localStorage.setItem(DRAFT_STORAGE_KEY, saved!)
    await useDraftStore.persist.rehydrate()
    expect(useDraftStore.getState()).toMatchObject({
      noteText: 'hello',
      currentStep: 3,
      player: { activeTrackId: '1', positionSeconds: 19, isPlaying: false },
    })
  })

  it('clears only when publication success invokes the explicit action', async () => {
    useDraftStore.setState({ songs: [song('1')], noteText: 'keep me' })
    expect(useDraftStore.getState().noteText).toBe('keep me')
    await useDraftStore.getState().clearAfterPublication()
    expect(useDraftStore.getState()).toMatchObject(initialDraft)
  })

  it('resets player state when its active song is removed', () => {
    useDraftStore.setState({
      songs: [song('1')],
      player: { activeTrackId: '1', positionSeconds: 12, isPlaying: true },
    })
    useDraftStore.getState().removeSong('1')
    expect(useDraftStore.getState().player).toEqual(initialDraft.player)
  })
})
