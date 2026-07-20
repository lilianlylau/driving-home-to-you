import { Logo } from '../../components/Logo'
import { ReceiverExperience } from '../../components/ReceiverExperience'

export function SharePage() {
  return (
    <main className="share-page page">
      <Logo />
      <section className="share-panel">
        <h1>share this link to invite them into your passenger seat.</h1>
        <label htmlFor="share-url">your link</label>
        <div className="share-field">
          <input id="share-url" readOnly value="https://drivinghometoyou.com/drive/example" />
          <button type="button">copy</button>
        </div>
        <p>links last 90 days. anyone with this link can view your letter and voice note.</p>
      </section>
      <ReceiverExperience showIntro />
    </main>
  )
}
