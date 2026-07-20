import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`logo ${compact ? 'logo--compact' : ''}`}
      aria-label="Driving Home to You, home"
    >
      <img src="/assets/logo/logo.png" alt="" />
    </Link>
  )
}
