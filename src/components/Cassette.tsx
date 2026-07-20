const fixtureTracks = ['Dreams - The Cranberries', 'Song - Artist', 'Song - Artist']

export function Cassette({
  editable = false,
  trackCount = 3,
}: {
  editable?: boolean
  trackCount?: 1 | 2 | 3
}) {
  return (
    <div className="cassette-wrap">
      <img src="/assets/mixtape/cassette-empty.png" alt="Black BASF 90 cassette mixtape" />
      <ol className="cassette-tracks">
        {fixtureTracks.slice(0, trackCount).map((track, index) => (
          <li key={`${index}-${track}`}>
            {track} {editable && <button type="button">remove</button>}
          </li>
        ))}
      </ol>
    </div>
  )
}
