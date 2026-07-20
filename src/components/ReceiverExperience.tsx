import { ButtonLink } from './Button'
import { Cassette } from './Cassette'
import { Letter } from './Letter'
import { Player } from './Player'

export function ReceiverExperience({
  standalone = false,
  showIntro = false,
}: {
  standalone?: boolean
  showIntro?: boolean
}) {
  return (
    <div className="receiver">
      {showIntro && (
        <header className="receiver__intro">
          <h1>someone wishes they were driving home to you.</h1>
          <p>pull up a seat. they left a few things on the dashboard for you.</p>
        </header>
      )}
      <div className="road-scene">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/assets/receiver-header/tape-recorder-on-dashboard.png"
          aria-label="A sunny drive past green trees"
        >
          <source src="/assets/receiver-header/sunny-drive-loop.mp4" type="video/mp4" />
        </video>
        <img
          src="/assets/receiver-header/tape-recorder-on-dashboard.png"
          alt="A tape recorder and headphones on a car dashboard"
        />
      </div>
      <section className="receiver__section">
        <h2>pop the mixtape in.</h2>
        <p>songs they picked for the road.</p>
        <Player />
        <Cassette />
      </section>
      <section className="receiver__section">
        <h2>a letter left on the passenger seat.</h2>
        <p>from them, to you.</p>
        <Letter />
      </section>
      <section className="receiver__section">
        <h2>a voice note from the drive.</h2>
        <p>press the tape recorder to hear their voice.</p>
        <button className="voice-toggle" type="button" aria-label="Play voice note">
          <img src="/assets/voice-memo/tape-recorder-on.png" alt="" />
        </button>
      </section>
      <footer className="receiver__closing">
        <h2>
          leave this screen open, turn up
          <br /> the volume, and enjoy the drive
          <br /> together.
        </h2>
        <ButtonLink to={standalone ? '/' : '/create/mixtape'}>
          {standalone ? 'start your drive home' : 'send a message back'}
        </ButtonLink>
      </footer>
    </div>
  )
}
