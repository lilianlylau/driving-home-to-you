import { Button } from '../../components/Button'
import { Cassette } from '../../components/Cassette'
import { CreatorHeader } from '../../components/CreatorHeader'
import { Player } from '../../components/Player'
import { useNavigate } from 'react-router-dom'
import { isValidSongSelection, useDraftStore } from '../../stores/draft'
import { SongSearch } from './SongSearch'

export function MixtapePage() {
  const navigate = useNavigate()
  const songs = useDraftStore((state) => state.songs)
  const removeSong = useDraftStore((state) => state.removeSong)
  const addSong = useDraftStore((state) => state.addSong)
  const setCurrentStep = useDraftStore((state) => state.setCurrentStep)
  return (
    <main className="creator-page page">
      <CreatorHeader step={1} />
      <section className="creator-content">
        <h1>step one. queue up the mixtape</h1>
        <p className="heading-3">pick up to three songs that reminds you of them</p>
        <SongSearch selected={songs} onAdd={addSong} />
        <h3 className="mixtape-playback-hint">press next to play your songs in order</h3>
        <Player tracks={songs} />
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
