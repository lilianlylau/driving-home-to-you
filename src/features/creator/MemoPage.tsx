import { CreatorHeader } from '../../components/CreatorHeader'
import { VoiceRecorder } from '../../components/VoiceRecorder'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../stores/draft'

export function MemoPage() {
  const navigate = useNavigate()
  const setCurrentStep = useDraftStore((state) => state.setCurrentStep)
  return (
    <main className="creator-page page">
      <CreatorHeader step={3} />
      <section className="creator-content">
        <h1>step three. record a voice memo</h1>
        <p className="heading-3">sometimes messages are better aloud. optional.</p>
        <VoiceRecorder
          onBack={() => {
            setCurrentStep(2)
            navigate('/create/letter')
          }}
          onComplete={() => {
            setCurrentStep(4)
            navigate('/create/share')
          }}
        />
      </section>
    </main>
  )
}
