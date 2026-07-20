import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LetterPage } from './LetterPage'
import { initialDraft, useDraftStore } from '../../stores/draft'

describe('LetterPage', () => {
  beforeEach(() => useDraftStore.setState(initialDraft))
  afterEach(cleanup)

  it('requires trimmed text, limits input, and announces the count', () => {
    render(
      <MemoryRouter>
        <LetterPage />
      </MemoryRouter>,
    )
    const letter = screen.getByRole('textbox', { name: 'Your letter' })
    const next = screen.getByRole('button', { name: 'next' })
    expect(next).toBeDisabled()
    fireEvent.change(letter, { target: { value: '   ' } })
    expect(next).toBeDisabled()
    fireEvent.change(letter, { target: { value: 'x'.repeat(501) } })
    expect(letter).toHaveValue('x'.repeat(500))
    expect(letter.closest('.letter')).toHaveClass('letter--expanded')
    expect(letter.closest('.letter')).toHaveStyle({ height: '403px' })
    expect(screen.getByLabelText('500 of 500 characters used')).toBeInTheDocument()
    expect(next).toBeEnabled()
  })

  it('grows vertically for explicit line breaks', () => {
    render(
      <MemoryRouter>
        <LetterPage />
      </MemoryRouter>,
    )
    const letter = screen.getByRole('textbox', { name: 'Your letter' })
    fireEvent.change(letter, { target: { value: Array(20).fill('hello').join('\n') } })
    expect(letter.closest('.letter')).toHaveStyle({ height: '460px' })
  })
})
