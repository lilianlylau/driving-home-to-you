import { useEffect, useRef, useState } from 'react'
import { useDraftStore } from '../../stores/draft'
import type { Song } from '../../types/domain'

export const PREVIEW_UNAVAILABLE_MESSAGE = 'this song preview is no longer available.'

export function formatElapsed(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

export function useMixtapePlayer(tracks: Song[]) {
  const player = useDraftStore((state) => state.player)
  const setPlayer = useDraftStore((state) => state.setPlayer)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const loadedTrackId = useRef<string | null>(null)
  const [errorTrackId, setErrorTrackId] = useState<string | null>(null)

  const activeIndex = tracks.findIndex(({ id }) => id === player.activeTrackId)
  const activeTrack = tracks[activeIndex] ?? null

  useEffect(() => {
    if (tracks.length === 0) return
    const audio = new Audio()
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
      audio.removeAttribute('src')
      loadedTrackId.current = null
      return
    }
    if (loadedTrackId.current !== activeTrack.id) {
      audio.src = activeTrack.audioUrl
      audio.currentTime = player.positionSeconds
      loadedTrackId.current = activeTrack.id
      setErrorTrackId(null)
    }
    if (player.isPlaying) {
      void audio.play().catch(() => {
        setErrorTrackId(activeTrack.id)
        setPlayer({ isPlaying: false })
      })
    } else audio.pause()
  }, [activeTrack, player.isPlaying, player.positionSeconds, setPlayer])

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
      if (!activeTrack) selectAt(0, true)
      else setPlayer({ isPlaying: !player.isPlaying })
    },
    previous: () =>
      selectAt(activeIndex > 0 ? activeIndex - 1 : tracks.length - 1, player.isPlaying),
    next: () => selectAt(activeIndex < tracks.length - 1 ? activeIndex + 1 : 0, player.isPlaying),
  }
}
