import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Player } from '../../components/Player'
import { initialDraft, useDraftStore } from '../../stores/draft'
import type { Song } from '../../types/domain'
import { PREVIEW_UNAVAILABLE_MESSAGE } from './useMixtapePlayer'

class FakeAudio extends EventTarget {
  static latest: FakeAudio
  currentTime = 0
  preload = ''
  crossOrigin: string | null = null
  src = ''
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  removeAttribute = vi.fn()
  constructor() {
    super()
    FakeAudio.latest = this
  }
}

const tracks: Song[] = [
  { id: '1', title: 'one', artist: 'artist one', audioUrl: 'https://audio.test/1' },
  { id: '2', title: 'two', artist: 'artist two', audioUrl: 'https://audio.test/2' },
]

describe('mixtape preview player', () => {
  beforeEach(() => {
    useDraftStore.setState(initialDraft)
    vi.stubGlobal('Audio', FakeAudio)
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('plays, transitions tracks, and records elapsed time', () => {
    render(<Player tracks={tracks} />)
    fireEvent.click(screen.getByRole('button', { name: 'Play track' }))
    expect(useDraftStore.getState().player).toMatchObject({ activeTrackId: '1', isPlaying: true })
    act(() => {
      FakeAudio.latest.currentTime = 7
      FakeAudio.latest.dispatchEvent(new Event('timeupdate'))
    })
    expect(screen.getByText('00:07')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next track' }))
    expect(useDraftStore.getState().player.activeTrackId).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'Previous track' }))
    expect(useDraftStore.getState().player.activeTrackId).toBe('1')
    act(() => FakeAudio.latest.dispatchEvent(new Event('ended')))
    expect(useDraftStore.getState().player.activeTrackId).toBe('2')
  })

  it('keeps the track and shows the required inline message on audio failure', async () => {
    render(<Player tracks={tracks} />)
    fireEvent.click(screen.getByRole('button', { name: 'Play track' }))
    act(() => FakeAudio.latest.dispatchEvent(new Event('error')))
    expect(await screen.findByRole('alert')).toHaveTextContent(PREVIEW_UNAVAILABLE_MESSAGE)
    expect(useDraftStore.getState().songs).toEqual([])
    expect(screen.getByText('one')).toBeInTheDocument()
  })
})
