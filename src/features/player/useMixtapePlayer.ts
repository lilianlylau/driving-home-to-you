import { useEffect, useRef, useState } from 'react'
import { useDraftStore } from '../../stores/draft'
import type { Song } from '../../types/domain'

export const PREVIEW_UNAVAILABLE_MESSAGE = 'this song preview is no longer available.'

let sharedAudio: HTMLAudioElement | null = null
let loadedTrackId: string | null = null

function getSharedAudio() {
  sharedAudio ??= new Audio()
  return sharedAudio
}

export function resetMixtapeAudioForTests() {
  sharedAudio?.pause()
  sharedAudio = null
  loadedTrackId = null
}

export function formatElapsed(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

export function useMixtapePlayer(tracks: Song[]) {
  const player = useDraftStore((state) => state.player)
  const setPlayer = useDraftStore((state) => state.setPlayer)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pendingLoadCleanupRef = useRef<(() => void) | null>(null)
  const [errorTrackId, setErrorTrackId] = useState<string | null>(null)

  const activeIndex = tracks.findIndex(({ id }) => id === player.activeTrackId)
  const activeTrack = tracks[activeIndex] ?? null

  useEffect(() => {
    if (tracks.length === 0) return
    const audio = getSharedAudio()
    audio.preload = 'metadata'
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    const updatePosition = () => setPlayer({ positionSeconds: audio.currentTime })
    const finishTrack = () => {
      const state = useDraftStore.getState()
      const currentIndex = tracks.findIndex(({ id }) => id === state.player.activeTrackId)
      const next = tracks[currentIndex + 1]
      if (next) setPlayer({ activeTrackId: next.id, positionSeconds: 0, isPlaying: true })
      else setPlayer({ positionSeconds: 0, isPlaying: false })
    }
    const failTrack = () => {
      setErrorTrackId(useDraftStore.getState().player.activeTrackId)
      setPlayer({ isPlaying: false })
    }

    audio.addEventListener('timeupdate', updatePosition)
    audio.addEventListener('ended', finishTrack)
    audio.addEventListener('error', failTrack)
    return () => {
      audio.pause()
      pendingLoadCleanupRef.current?.()
      pendingLoadCleanupRef.current = null
      const state = useDraftStore.getState()
      if (state.player.isPlaying) {
        state.setPlayer({ isPlaying: false })
      }
      audio.removeEventListener('timeupdate', updatePosition)
      audio.removeEventListener('ended', finishTrack)
      audio.removeEventListener('error', failTrack)
      audioRef.current = null
    }
  }, [setPlayer, tracks])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!activeTrack) {
      audio.pause()
      pendingLoadCleanupRef.current?.()
      pendingLoadCleanupRef.current = null
      audio.removeAttribute('src')
      loadedTrackId = null
      return
    }
    if (loadedTrackId !== activeTrack.id || audio.src !== activeTrack.audioUrl) {
      pendingLoadCleanupRef.current?.()
      audio.src = activeTrack.audioUrl
      loadedTrackId = activeTrack.id
      setErrorTrackId(null)
      const restoreLoadedTrack = () => {
        pendingLoadCleanupRef.current = null
        const state = useDraftStore.getState().player
        const duration = Number.isFinite(audio.duration) ? audio.duration : state.positionSeconds
        audio.currentTime = Math.min(state.positionSeconds, Math.max(0, duration))
        if (state.isPlaying) {
          void audio.play().catch(() => {
            setErrorTrackId(activeTrack.id)
            setPlayer({ isPlaying: false })
          })
        }
      }
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) restoreLoadedTrack()
      else {
        audio.addEventListener('loadedmetadata', restoreLoadedTrack, { once: true })
        pendingLoadCleanupRef.current = () =>
          audio.removeEventListener('loadedmetadata', restoreLoadedTrack)
      }
      return
    }
    if (player.isPlaying) {
      if (audio.readyState < HTMLMediaElement.HAVE_METADATA) return
      void audio.play().catch(() => {
        setErrorTrackId(activeTrack.id)
        setPlayer({ isPlaying: false })
      })
    } else audio.pause()
  }, [activeTrack, player.isPlaying, setPlayer])

  const selectAt = (index: number, play: boolean) => {
    const track = tracks[index]
    if (!track) return
    setPlayer({ activeTrackId: track.id, positionSeconds: 0, isPlaying: play })
  }

  return {
    activeTrack,
    elapsed: formatElapsed(player.positionSeconds),
    isPlaying: player.isPlaying,
    error: errorTrackId === activeTrack?.id ? PREVIEW_UNAVAILABLE_MESSAGE : null,
    toggle: () => {
      if (!activeTrack) {
        const firstTrack = tracks[0]
        if (!firstTrack) return
        const audio = audioRef.current
        if (audio) {
          audio.src = firstTrack.audioUrl
          loadedTrackId = firstTrack.id
          setErrorTrackId(null)
          void audio.play().catch(() => {
            setErrorTrackId(firstTrack.id)
            setPlayer({ isPlaying: false })
          })
        }
        selectAt(0, true)
      } else if (player.isPlaying) setPlayer({ isPlaying: false })
      else {
        const audio = audioRef.current
        setErrorTrackId(null)
        setPlayer({ isPlaying: true })
        // Call play during the click itself. Waiting for metadata would lose the
        // browser's user-activation window and may be rejected as autoplay.
        if (audio) {
          void audio.play().catch(() => {
            setErrorTrackId(activeTrack.id)
            setPlayer({ isPlaying: false })
          })
        }
      }
    },
    previous: () =>
      selectAt(activeIndex > 0 ? activeIndex - 1 : tracks.length - 1, player.isPlaying),
    next: () => selectAt(activeIndex < tracks.length - 1 ? activeIndex + 1 : 0, player.isPlaying),
  }
}
