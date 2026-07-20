import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '../features/landing/LandingPage'
import { MixtapePage } from '../features/creator/MixtapePage'
import { NotFoundPage } from '../features/not-found/NotFoundPage'

describe('route shells', () => {
  it('renders the landing page call to action', () => {
    render(
      <RouterProvider router={createMemoryRouter([{ path: '/', element: <LandingPage /> }])} />,
    )
    expect(screen.getByRole('link', { name: 'start here' })).toHaveAttribute(
      'href',
      '/create/mixtape',
    )
  })
  it('renders semantic mixtape controls', () => {
    render(
      <RouterProvider router={createMemoryRouter([{ path: '/', element: <MixtapePage /> }])} />,
    )
    expect(screen.getByRole('heading', { name: /step one/i })).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })
  it('uses the required not-found copy', () => {
    render(
      <RouterProvider router={createMemoryRouter([{ path: '/', element: <NotFoundPage /> }])} />,
    )
    expect(
      screen.getByRole('heading', { name: "sorry we couldn't find your mixtape and letter" }),
    ).toBeInTheDocument()
  })
})
