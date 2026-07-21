import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Player } from '../../components/Player'
import { initialDraft, useDraftStore } from '../../stores/draft'
import type { Song } from '../../types/domain'
import { PREVIEW_UNAVAILABLE_MESSAGE, resetMixtapeAudioForTests } from './useMixtapePlayer'

class FakeAudio extends EventTarget {
  static latest: FakeAudio
  static instances: FakeAudio[] = []
  static initialReadyState: number = HTMLMediaElement.HAVE_METADATA
  currentTime = 0
  readyState = FakeAudio.initialReadyState
  preload = ''
  crossOrigin: string | null = null
  src = ''
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  load = vi.fn()
  removeAttribute = vi.fn()
  constructor() {
    super()
    FakeAudio.latest = this
    FakeAudio.instances.push(this)
  }
}

const tracks: Song[] = [
  { id: '1', title: 'one', artist: 'artist one', audioUrl: 'https://audio.test/1' },
  { id: '2', title: 'two', artist: 'artist two', audioUrl: 'https://audio.test/2' },
]

describe('mixtape preview player', () => {
  beforeEach(() => {
    useDraftStore.setState(initialDraft)
    FakeAudio.initialReadyState = HTMLMediaElement.HAVE_METADATA
    FakeAudio.instances = []
    vi.stubGlobal('Audio', FakeAudio)
    resetMixtapeAudioForTests()
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
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

  it('restores a retained track paused and playable after navigation', () => {
    const firstRender = render(<Player tracks={tracks} />)
    fireEvent.click(screen.getByRole('button', { name: 'Play track' }))
    act(() => {
      FakeAudio.latest.currentTime = 8
      FakeAudio.latest.dispatchEvent(new Event('timeupdate'))
    })

    firstRender.unmount()
    expect(useDraftStore.getState().player).toEqual({
      activeTrackId: '1',
      positionSeconds: 8,
      isPlaying: false,
    })

    useDraftStore.setState((state) => ({
      player: { ...state.player, isPlaying: false },
    }))
    FakeAudio.initialReadyState = HTMLMediaElement.HAVE_NOTHING
    render(<Player tracks={tracks} />)
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('00:08')).toBeInTheDocument()
    FakeAudio.latest.play.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Play track' }))
    const callsFromClick = FakeAudio.latest.play.mock.calls.length
    expect(callsFromClick).toBeGreaterThan(0)
    FakeAudio.latest.readyState = HTMLMediaElement.HAVE_METADATA
    act(() => FakeAudio.latest.dispatchEvent(new Event('loadedmetadata')))
    expect(FakeAudio.latest.play.mock.calls.length).toBeGreaterThanOrEqual(callsFromClick)
    expect(useDraftStore.getState().player.isPlaying).toBe(true)
    expect(FakeAudio.instances).toHaveLength(1)
  })

  it('plays a hardcoded preview without changing the creator player state', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.resolve())
    render(<Player previewTrack={tracks[0]!} />)
    fireEvent.click(screen.getByRole('button', { name: 'Play track' }))
    expect(play).toHaveBeenCalledOnce()
    expect(useDraftStore.getState().player).toEqual(initialDraft.player)
    expect(await screen.findByRole('button', { name: 'Pause track' })).toBeInTheDocument()
  })
})
