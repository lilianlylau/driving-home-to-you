const fixtureTracks = ['Dreams - The Cranberries', 'Song - Artist', 'Song - Artist']

export function Cassette({
  editable = false,
  trackCount = 3,
  tracks,
  onRemove,
}: {
  editable?: boolean
  trackCount?: 1 | 2 | 3
  tracks?: { id: string; title: string; artist: string }[]
  onRemove?: (id: string) => void
}) {
  const displayedTracks =
    tracks ??
    fixtureTracks
      .slice(0, trackCount)
      .map((track, index) => ({ id: String(index), title: track, artist: '' }))
  return (
    <div className="cassette-wrap">
      <img src="/assets/mixtape/cassette-empty.png" alt="Black BASF 90 cassette mixtape" />
      <ol className="cassette-tracks">
        {displayedTracks.map((track) => (
          <li key={track.id}>
            {track.artist ? `${track.title} - ${track.artist}` : track.title}{' '}
            {editable && (
              <button type="button" onClick={() => onRemove?.(track.id)}>
                remove
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
