import { useRef, useState } from 'react'
import {
  formatElapsed,
  PREVIEW_UNAVAILABLE_MESSAGE,
  useMixtapePlayer,
} from '../features/player/useMixtapePlayer'
import type { Song } from '../types/domain'

interface PlayerProps {
  title?: string
  artist?: string
  elapsed?: string
  status?: string
  tracks?: Song[]
  previewTrack?: Song
}

interface PlayerViewProps {
  title: string
  artist: string
  elapsed: string
  status?: string
  isPlaying?: boolean
  disabled?: boolean
  error?: string | null
  onPrevious?: () => void
  onToggle?: () => void
  onNext?: () => void
}

function PlayerView({
  title,
  artist,
  elapsed,
  status,
  isPlaying = false,
  disabled = false,
  error,
  onPrevious,
  onToggle,
  onNext,
}: PlayerViewProps) {
  return (
    <section className="player-wrap" aria-label="Mixtape player">
      <div className="player">
        <div className="player__label">tape</div>
        <div className="player__screen">
          <span>
            {status ?? (
              <>
                {title}
                <small>{artist}</small>
              </>
            )}
          </span>
          <time>{elapsed}</time>
        </div>
        <div className="player__controls">
          <button
            type="button"
            aria-label="Previous track"
            disabled={disabled}
            onClick={onPrevious}
          >
            |◀
          </button>
          <button
            type="button"
            aria-label={isPlaying ? 'Pause track' : 'Play track'}
            disabled={disabled}
            onClick={onToggle}
          >
            {isPlaying ? 'Ⅱ' : '▶'}
          </button>
          <button type="button" aria-label="Next track" disabled={disabled} onClick={onNext}>
            ▶|
          </button>
        </div>
      </div>
      {error && (
        <p className="player-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

function InteractivePlayer({ tracks, status }: { tracks: Song[]; status?: string }) {
  const playback = useMixtapePlayer(tracks)
  return (
    <PlayerView
      title={playback.activeTrack?.title ?? (tracks.length ? 'ready to play' : 'choose a song')}
      artist={playback.activeTrack?.artist ?? (tracks.length ? 'select play' : '')}
      elapsed={playback.elapsed}
      status={status}
      isPlaying={playback.isPlaying}
      disabled={!tracks.length}
      error={playback.error}
      onPrevious={playback.previous}
      onToggle={playback.toggle}
      onNext={playback.next}
    />
  )
}

function PreviewPlayer({ track }: { track: Song }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }
    setError(null)
    void audio.play().then(
      () => setIsPlaying(true),
      () => {
        setIsPlaying(false)
        setError(PREVIEW_UNAVAILABLE_MESSAGE)
      },
    )
  }

  const restart = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    setElapsed(0)
  }

  return (
    <>
      <PlayerView
        title={track.title}
        artist={track.artist}
        elapsed={formatElapsed(elapsed)}
        isPlaying={isPlaying}
        error={error}
        onPrevious={restart}
        onToggle={toggle}
        onNext={restart}
      />
      <audio
        ref={audioRef}
        src={track.audioUrl}
        preload="metadata"
        crossOrigin="anonymous"
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onEnded={() => {
          setIsPlaying(false)
          setElapsed(0)
        }}
        onError={() => {
          setIsPlaying(false)
          setError(PREVIEW_UNAVAILABLE_MESSAGE)
        }}
      />
    </>
  )
}

export function Player({
  title = 'dreams',
  artist = 'the cranberries',
  elapsed = '00:00',
  status,
  tracks,
  previewTrack,
}: PlayerProps) {
  if (tracks !== undefined) return <InteractivePlayer tracks={tracks} status={status} />
  if (previewTrack) return <PreviewPlayer track={previewTrack} />
  return <PlayerView title={title} artist={artist} elapsed={elapsed} status={status} />
}
