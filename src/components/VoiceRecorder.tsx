import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './Button'
import { Player } from './Player'
import {
  deleteVoiceMemoBlob,
  getVoiceMemoBlob,
  saveVoiceMemoBlob,
  useDraftStore,
} from '../stores/draft'
import {
  MAX_VOICE_MEMO_BYTES,
  MAX_VOICE_MEMO_DURATION_MS,
  selectRecorderMimeType,
} from '../lib/voiceRecording'

function formatDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000)
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`
}

type RecorderState = 'loading' | 'empty' | 'recording' | 'recorded'

export function VoiceRecorder({
  onBack,
  onComplete,
}: {
  onBack?: () => void
  onComplete?: () => void
}) {
  const voiceMemo = useDraftStore((state) => state.voiceMemo)
  const setVoiceMemo = useDraftStore((state) => state.setVoiceMemo)
  const [state, setState] = useState<RecorderState>(voiceMemo ? 'loading' : 'empty')
  const [elapsedMs, setElapsedMs] = useState(voiceMemo?.durationMs ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const restoredRef = useRef(false)

  const replaceAudioUrl = useCallback((blob: Blob | null) => {
    setAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return blob ? URL.createObjectURL(blob) : null
    })
  }, [])

  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    let active = true
    if (!voiceMemo) return
    void getVoiceMemoBlob()
      .then((blob) => {
        if (!active) return
        if (!blob) {
          setVoiceMemo(null)
          setState('empty')
          return
        }
        replaceAudioUrl(blob)
        setState('recorded')
      })
      .catch(() => {
        if (active) {
          setError('we could not restore your recording. please record it again.')
          setVoiceMemo(null)
          setState('empty')
        }
      })
    return () => {
      active = false
    }
  }, [replaceAudioUrl, setVoiceMemo, voiceMemo])

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    },
    [audioUrl],
  )

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }, [])

  const startRecording = async () => {
    setError(null)
    setIsPlaying(false)
    audioRef.current?.pause()
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('voice recording is not supported in this browser.')
      return
    }
    const mimeType = selectRecorderMimeType(MediaRecorder)
    if (!mimeType) {
      setError('voice recording is not supported in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = ({ data }) => {
        if (data.size) chunksRef.current.push(data)
      }
      recorder.onerror = () => setError('something went wrong while recording. please try again.')
      recorder.onstop = () => {
        if (timerRef.current !== null) window.clearInterval(timerRef.current)
        timerRef.current = null
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        const durationMs = Math.min(MAX_VOICE_MEMO_DURATION_MS, Date.now() - startedAtRef.current)
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType })
        if (!blob.size) {
          setError('no audio was captured. please try again.')
          setState('empty')
          return
        }
        if (blob.size > MAX_VOICE_MEMO_BYTES) {
          setError('your recording is over 5 MB. please record a shorter message.')
          setState('empty')
          return
        }
        void saveVoiceMemoBlob(blob)
          .then(() => {
            setVoiceMemo({
              durationMs: Math.max(1, durationMs),
              mimeType: blob.type,
              size: blob.size,
            })
            setElapsedMs(durationMs)
            replaceAudioUrl(blob)
            setState('recorded')
          })
          .catch(() => {
            setError('we could not save your recording. please try again.')
            setState('empty')
          })
      }
      startedAtRef.current = Date.now()
      setElapsedMs(0)
      setState('recording')
      recorder.start(250)
      timerRef.current = window.setInterval(() => {
        const duration = Date.now() - startedAtRef.current
        setElapsedMs(Math.min(duration, MAX_VOICE_MEMO_DURATION_MS))
        if (duration >= MAX_VOICE_MEMO_DURATION_MS) stopRecording()
      }, 250)
    } catch (cause) {
      setError(
        cause instanceof DOMException &&
          (cause.name === 'NotAllowedError' || cause.name === 'SecurityError')
          ? 'microphone access was denied. allow access and try again.'
          : 'we could not access your microphone. please try again.',
      )
      setState(voiceMemo ? 'recorded' : 'empty')
    }
  }

  const discardRecording = async () => {
    audioRef.current?.pause()
    replaceAudioUrl(null)
    setIsPlaying(false)
    setVoiceMemo(null)
    setElapsedMs(0)
    await deleteVoiceMemoBlob().catch(() => undefined)
    setState('empty')
  }

  const togglePlayback = async () => {
    if (!audioRef.current) return
    setError(null)
    if (!audioRef.current.paused) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }
    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
      setError('your voice memo could not be played. please try again.')
    }
  }

  const isEmpty = state === 'empty' || state === 'loading'
  return (
    <div className="voice-recorder" aria-busy={state === 'loading'}>
      {!isEmpty && (
        <Player
          status={state === 'recording' ? 'recording...' : 'voice memo'}
          elapsed={formatDuration(elapsedMs)}
        />
      )}
      <div className="voice-recorder__art">
        {!isEmpty && (
          <img
            className="voice-recorder__strip"
            src={`/assets/voice-memo/tape-${state === 'recording' ? 'recording' : 'recorded'}.png`}
            alt=""
          />
        )}
        <img
          src={`/assets/voice-memo/tape-recorder-${state === 'recording' ? 'on' : 'off'}.png`}
          alt={
            state === 'recording' ? 'Portable tape recorder recording' : 'Portable tape recorder'
          }
        />
      </div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            setIsPlaying(false)
            setError('your voice memo could not be played. please try again.')
          }}
        />
      )}
      {error && (
        <p className="voice-recorder__error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        {isEmpty && (
          <>
            <Button tone="red" disabled={state === 'loading'} onClick={() => void startRecording()}>
              record audio
            </Button>
            <Button onClick={onBack}>back</Button>
            <Button
              disabled={state === 'loading'}
              onClick={() => void discardRecording().then(onComplete)}
            >
              skip
            </Button>
          </>
        )}
        {state === 'recording' && (
          <Button tone="red" onClick={stopRecording}>
            stop recording
          </Button>
        )}
        {state === 'recorded' && (
          <>
            <Button onClick={() => void togglePlayback()}>
              {isPlaying ? 'pause' : 'play back'}
            </Button>
            <Button tone="red" onClick={() => void discardRecording().then(startRecording)}>
              record again
            </Button>
            <Button onClick={onComplete}>done</Button>
          </>
        )}
      </div>
    </div>
  )
}
