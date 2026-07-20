import { Button } from '../../components/Button'
import { CreatorHeader } from '../../components/CreatorHeader'
import { Letter } from '../../components/Letter'
import { isValidNote, useDraftStore } from '../../stores/draft'
import { useNavigate } from 'react-router-dom'

export function LetterPage() {
  const { noteText, setNoteText } = useDraftStore()
  const navigate = useNavigate()
  const setCurrentStep = useDraftStore((state) => state.setCurrentStep)
  return (
    <main className="creator-page page">
      <CreatorHeader step={2} />
      <section className="creator-content">
        <h1>step two. write them a letter</h1>
        <p className="heading-3">
          leave a note for the dashboard. it can be
          <br /> long, short, or just a quick hello.
        </p>
        <Letter editable value={noteText} onChange={setNoteText} />
        <output
          className="character-count"
          aria-live="polite"
          aria-label={`${noteText.length} of 500 characters used`}
        >
          {noteText.length}/500
        </output>
        <div className="actions">
          <Button
            onClick={() => {
              setCurrentStep(1)
              navigate('/create/mixtape')
            }}
          >
            back
          </Button>
          <Button
            disabled={!isValidNote(noteText)}
            onClick={() => {
              setCurrentStep(3)
              navigate('/create/memo')
            }}
          >
            next
          </Button>
        </div>
      </section>
    </main>
  )
}
