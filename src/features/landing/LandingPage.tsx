import { ButtonLink } from '../../components/Button'
import { Logo } from '../../components/Logo'
import { ReceiverExperience } from '../../components/ReceiverExperience'

export function LandingPage() {
  return (
    <main className="landing page">
      <section className="hero">
        <Logo />
        <h1>drive home to someone you miss</h1>
        <p className="heading-3">
          pack a mixtape, a letter, and a voice note.
          <br />
          start your drive home to someone far away.
        </p>
        <ButtonLink to="/create/mixtape">start here</ButtonLink>
      </section>
      <section className="preview">
        <header>
          <h2>preview the passenger seat</h2>
          <p className="heading-3">
            the passenger can leave this screen open,
            <br /> turn up the volume, and enjoy the drive together.
          </p>
        </header>
        <ReceiverExperience cassetteTrackCount={1} showClosingAction={false} />
      </section>
    </main>
  )
}
