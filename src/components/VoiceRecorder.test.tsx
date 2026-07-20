import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VoiceRecorder } from './VoiceRecorder'
import { MAX_VOICE_MEMO_DURATION_MS } from '../lib/voiceRecording'
import * as draft from '../stores/draft'

class FakeMediaRecorder {
  static isTypeSupported = vi.fn((type: string) => type === 'audio/webm;codecs=opus')
  state: RecordingState = 'inactive'
  mimeType: string
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? ''
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['voice'], { type: this.mimeType }) } as BlobEvent)
    this.onstop?.()
  }
}

const stopTrack = vi.fn()
const getUserMedia = vi.fn(
  async () => ({ getTracks: () => [{ stop: stopTrack }] }) as unknown as MediaStream,
)

describe('VoiceRecorder', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })
  beforeEach(() => {
    vi.restoreAllMocks()
    draft.useDraftStore.setState(draft.initialDraft)
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: FakeMediaRecorder,
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:memo'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    getUserMedia.mockClear()
    stopTrack.mockClear()
    vi.spyOn(draft, 'saveVoiceMemoBlob').mockResolvedValue(draft.VOICE_MEMO_BLOB_KEY)
    vi.spyOn(draft, 'deleteVoiceMemoBlob').mockResolvedValue(undefined)
    vi.spyOn(draft, 'getVoiceMemoBlob').mockResolvedValue(undefined)
  })

  it('reports microphone permission denial', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
    render(<VoiceRecorder />)
    fireEvent.click(screen.getByRole('button', { name: 'record audio' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('microphone access was denied')
  })

  it('reports unsupported recording without requesting permission', async () => {
    Object.defineProperty(globalThis, 'MediaRecorder', { configurable: true, value: undefined })
    render(<VoiceRecorder />)
    fireEvent.click(screen.getByRole('button', { name: 'record audio' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('not supported')
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('automatically stops and saves at two minutes', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    render(<VoiceRecorder />)
    fireEvent.click(screen.getByRole('button', { name: 'record audio' }))
    await act(async () => {})
    expect(screen.getByRole('button', { name: 'stop recording' })).toBeInTheDocument()
    await act(async () => {
      vi.advanceTimersByTime(MAX_VOICE_MEMO_DURATION_MS)
      await Promise.resolve()
    })
    expect(screen.getByRole('button', { name: 'play back' })).toBeInTheDocument()
    expect(draft.useDraftStore.getState().voiceMemo?.durationMs).toBe(MAX_VOICE_MEMO_DURATION_MS)
    expect(stopTrack).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('replaces a saved recording and removes its prior blob', async () => {
    draft.useDraftStore.setState({
      voiceMemo: { durationMs: 1000, mimeType: 'audio/webm', size: 5 },
    })
    vi.mocked(draft.getVoiceMemoBlob).mockResolvedValue(new Blob(['old']))
    render(<VoiceRecorder />)
    await screen.findByRole('button', { name: 'record again' })
    fireEvent.click(screen.getByRole('button', { name: 'record again' }))
    await waitFor(() => expect(draft.deleteVoiceMemoBlob).toHaveBeenCalled())
    await screen.findByRole('button', { name: 'stop recording' })
  })

  it('restores a completed recording after refresh', async () => {
    draft.useDraftStore.setState({
      voiceMemo: { durationMs: 32000, mimeType: 'audio/webm', size: 5 },
    })
    vi.mocked(draft.getVoiceMemoBlob).mockResolvedValue(new Blob(['voice']))
    render(<VoiceRecorder />)
    expect(await screen.findByRole('button', { name: 'play back' })).toBeInTheDocument()
    expect(screen.getByText('00:32')).toBeInTheDocument()
  })

  it('shows playback failures and keeps the recording', async () => {
    draft.useDraftStore.setState({
      voiceMemo: { durationMs: 1000, mimeType: 'audio/webm', size: 5 },
    })
    vi.mocked(draft.getVoiceMemoBlob).mockResolvedValue(new Blob(['voice']))
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new Error('failed'))
    render(<VoiceRecorder />)
    fireEvent.click(await screen.findByRole('button', { name: 'play back' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be played')
    expect(play).toHaveBeenCalled()
    expect(draft.useDraftStore.getState().voiceMemo).not.toBeNull()
  })

  it('skips without recording and completes the step', async () => {
    const onComplete = vi.fn()
    render(<VoiceRecorder onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: 'skip' }))
    await waitFor(() => expect(onComplete).toHaveBeenCalled())
    expect(draft.deleteVoiceMemoBlob).toHaveBeenCalled()
  })
})
