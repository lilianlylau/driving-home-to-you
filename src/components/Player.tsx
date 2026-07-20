export function Player({
  title = 'dreams',
  artist = 'the cranberries',
  elapsed = '00:00',
  status,
}: {
  title?: string
  artist?: string
  elapsed?: string
  status?: string
}) {
  return (
    <section className="player" aria-label="Mixtape player">
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
        <button type="button" aria-label="Previous track">
          |◀
        </button>
        <button type="button" aria-label="Play track">
          ▶
        </button>
        <button type="button" aria-label="Next track">
          ▶|
        </button>
      </div>
    </section>
  )
}
