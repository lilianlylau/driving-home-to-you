import { CreatorHeader } from '../../components/CreatorHeader'
import { VoiceRecorder } from '../../components/VoiceRecorder'

export function MemoPage() {
  return (
    <main className="creator-page page">
      <CreatorHeader step={3} />
      <section className="creator-content">
        <h1>step three. record a voice memo</h1>
        <p>sometimes messages are better aloud. optional.</p>
        <VoiceRecorder />
      </section>
    </main>
  )
}
