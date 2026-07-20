import { useMixtapePlayer } from '../features/player/useMixtapePlayer'
import type { Song } from '../types/domain'

interface PlayerProps {
  title?: string
  artist?: string
  elapsed?: string
  status?: string
  tracks?: Song[]
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

export function Player({
  title = 'dreams',
  artist = 'the cranberries',
  elapsed = '00:00',
  status,
  tracks,
}: PlayerProps) {
  if (tracks !== undefined) return <InteractivePlayer tracks={tracks} status={status} />
  return <PlayerView title={title} artist={artist} elapsed={elapsed} status={status} />
}
