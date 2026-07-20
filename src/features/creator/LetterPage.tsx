import { ButtonLink } from '../../components/Button'
import { CreatorHeader } from '../../components/CreatorHeader'
import { Letter } from '../../components/Letter'
import { useDraftStore } from '../../stores/draft'

export function LetterPage() {
  const { noteText, setNoteText } = useDraftStore()
  return (
    <main className="creator-page page">
      <CreatorHeader step={2} />
      <section className="creator-content">
        <h1>step two. write them a letter</h1>
        <p>
          leave a note for the dashboard. it can be
          <br /> long, short, or just a quick hello.
        </p>
        <Letter editable value={noteText} onChange={setNoteText} />
        <output className="character-count" aria-live="polite">
          {noteText.length}/500
        </output>
        <div className="actions">
          <ButtonLink to="/create/mixtape">back</ButtonLink>
          <ButtonLink to="/create/memo">next</ButtonLink>
        </div>
      </section>
    </main>
  )
}
