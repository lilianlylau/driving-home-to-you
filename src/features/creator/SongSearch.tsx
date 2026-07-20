import { useEffect, useRef, useState } from 'react'
import { MAX_SONG_QUERY_LENGTH, MIN_SONG_QUERY_LENGTH, searchSongs } from '../../lib/songSearch'
import type { Song } from '../../types/domain'

const SEARCH_DELAY_MS = 350

export function SongSearch({
  selected,
  onAdd,
}: {
  selected: Song[]
  onAdd: (song: Song) => boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Song[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const requestId = useRef(0)

  useEffect(() => {
    const normalized = query.trim()
    const currentRequest = ++requestId.current
    if (normalized.length < MIN_SONG_QUERY_LENGTH) {
      setResults([])
      setStatus('idle')
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setStatus('loading')
      void searchSongs(normalized, controller.signal)
        .then((songs) => {
          if (requestId.current !== currentRequest) return
          setResults(songs)
          setStatus('idle')
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || requestId.current !== currentRequest) return
          setStatus('error')
          if (error instanceof Error) return
        })
    }, SEARCH_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return (
    <div className="song-search">
      <label className="sr-only" htmlFor="song-search">
        Search for a song or artist
      </label>
      <input
        id="song-search"
        className="search"
        type="search"
        maxLength={MAX_SONG_QUERY_LENGTH}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="search song or artist"
        autoComplete="off"
      />
      <div className="song-search__status" aria-live="polite">
        {status === 'loading' && 'searching...'}
        {status === 'error' && (
          <>
            <span>we couldn't search for songs.</span>{' '}
            <button type="button" onClick={() => setQuery((value) => `${value} `)}>
              retry
            </button>
          </>
        )}
        {status === 'idle' &&
          query.trim().length >= MIN_SONG_QUERY_LENGTH &&
          results.length === 0 &&
          'no songs found.'}
      </div>
      {results.length > 0 && (
        <ul className="song-results">
          {results.map((song) => {
            const isSelected = selected.some(({ id }) => id === song.id)
            const isFull = selected.length >= 3
            return (
              <li key={song.id}>
                <span>
                  {song.title}
                  <small>{song.artist}</small>
                </span>
                <button
                  type="button"
                  disabled={isSelected || isFull}
                  onClick={() => {
                    if (!onAdd(song)) return
                    setQuery('')
                    setResults([])
                  }}
                >
                  {isSelected ? 'added' : 'add'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
