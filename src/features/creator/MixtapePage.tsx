import { ButtonLink } from '../../components/Button'
import { Cassette } from '../../components/Cassette'
import { CreatorHeader } from '../../components/CreatorHeader'
import { Player } from '../../components/Player'

export function MixtapePage() {
  return (
    <main className="creator-page page">
      <CreatorHeader step={1} />
      <section className="creator-content">
        <h1>step one. queue up the mixtape</h1>
        <p>pick up to three songs that reminds you of them</p>
        <label className="sr-only" htmlFor="song-search">
          Search for a song or artist
        </label>
        <input
          id="song-search"
          className="search"
          type="search"
          placeholder="search song or artist"
        />
        <Player />
        <Cassette editable />
        <div className="actions">
          <ButtonLink to="/create/letter">next</ButtonLink>
        </div>
      </section>
    </main>
  )
}
