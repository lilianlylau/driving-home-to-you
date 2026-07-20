import { Logo } from '../../components/Logo'
import { ReceiverExperience } from '../../components/ReceiverExperience'

export function DrivePage() {
  return (
    <main className="drive-page page">
      <Logo />
      <ReceiverExperience standalone showIntro />
    </main>
  )
}
