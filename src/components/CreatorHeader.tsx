import { Logo } from './Logo'

export function CreatorHeader({ step }: { step: 1 | 2 | 3 }) {
  return (
    <header className="creator-header">
      <Logo />
      <img
        className="fuel-gauge"
        src={`/assets/creator-header/fuel-gauge-step-${step}.png`}
        alt={`Step ${step} of 3`}
      />
    </header>
  )
}
