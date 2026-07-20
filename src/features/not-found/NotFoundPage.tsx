import { ButtonLink } from '../../components/Button'
import { Logo } from '../../components/Logo'

export function NotFoundPage() {
  return (
    <main className="not-found page">
      <Logo />
      <h1>sorry we couldn't find your mixtape and letter</h1>
      <p>the link may have expired, or the drive may no longer be available.</p>
      <ButtonLink to="/">return home</ButtonLink>
      <a className="abuse-link" href="mailto:abuse@example.com">
        report abuse
      </a>
    </main>
  )
}
