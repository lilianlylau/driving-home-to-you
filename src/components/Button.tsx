import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'charcoal' | 'red' }

export function Button({ tone = 'charcoal', className = '', ...props }: ButtonProps) {
  return <button className={`button button--${tone} ${className}`} {...props} />
}

export function ButtonLink({
  to,
  children,
  tone = 'charcoal',
}: {
  to: string
  children: ReactNode
  tone?: 'charcoal' | 'red'
}) {
  return (
    <Link className={`button button--${tone}`} to={to}>
      {children}
    </Link>
  )
}
