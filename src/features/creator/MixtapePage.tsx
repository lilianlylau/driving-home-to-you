import { Button } from '../../components/Button'
import { Cassette } from '../../components/Cassette'
import { CreatorHeader } from '../../components/CreatorHeader'
import { Player } from '../../components/Player'
import { useNavigate } from 'react-router-dom'
import { isValidSongSelection, useDraftStore } from '../../stores/draft'

export function MixtapePage() {
  const navigate = useNavigate()
  const songs = useDraftStore((state) => state.songs)
  const removeSong = useDraftStore((state) => state.removeSong)
  const setCurrentStep = useDraftStore((state) => state.setCurrentStep)
  return (
    <main className="creator-page page">
      <CreatorHeader step={1} />
      <section className="creator-content">
        <h1>step one. queue up the mixtape</h1>
        <p className="heading-3">pick up to three songs that reminds you of them</p>
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
        <Cassette editable tracks={songs} onRemove={removeSong} />
        <div className="actions">
          <Button
            disabled={!isValidSongSelection(songs)}
            onClick={() => {
              setCurrentStep(2)
              navigate('/create/letter')
            }}
          >
            next
          </Button>
        </div>
      </section>
    </main>
  )
}
