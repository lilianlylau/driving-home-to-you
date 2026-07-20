export function Cassette({ editable = false }: { editable?: boolean }) {
  return (
    <div className="cassette-wrap">
      <img src="/assets/mixtape/cassette-empty.png" alt="Black BASF 90 cassette mixtape" />
      <ol className="cassette-tracks">
        <li>Dreams - The Cranberries {editable && <button type="button">remove</button>}</li>
        <li>Song - Artist {editable && <button type="button">remove</button>}</li>
        <li>Song - Artist {editable && <button type="button">remove</button>}</li>
      </ol>
    </div>
  )
}
