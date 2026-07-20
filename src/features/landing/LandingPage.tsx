import { ButtonLink } from '../../components/Button'
import { Logo } from '../../components/Logo'
import { ReceiverExperience } from '../../components/ReceiverExperience'
import type { Song } from '../../types/domain'

const LANDING_PREVIEW_SONG: Song = {
  id: '1440735258',
  title: 'dreams',
  artist: 'the cranberries',
  audioUrl:
    'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8b/e8/b4/8be8b47f-901f-21ae-d0a0-5b1c8a42e790/mzaf_13536093405625232011.plus.aac.p.m4a',
  albumArtUrl:
    'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b6/c8/85/b6c885de-fde6-d40d-c95a-d89ede4270ae/06UMGIM09433.rgb.jpg/100x100bb.jpg',
}

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
        <ReceiverExperience
          cassetteTrackCount={1}
          showClosingAction={false}
          previewSong={LANDING_PREVIEW_SONG}
        />
      </section>
    </main>
  )
}
