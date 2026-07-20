import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialDraft, useDraftStore } from '../../stores/draft'
import type { Song } from '../../types/domain'
import { MixtapePage } from './MixtapePage'

const result = (id: string): Song => ({
  id,
  title: `song ${id}`,
  artist: 'artist',
  audioUrl: `https://audio.test/${id}`,
})

function renderPage() {
  return render(
    <RouterProvider router={createMemoryRouter([{ path: '/', element: <MixtapePage /> }])} />,
  )
}

describe('mixtape song search', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useDraftStore.setState(initialDraft)
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('debounces search and ignores stale responses', async () => {
    const pending: Array<(value: Response) => void> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => pending.push(resolve))),
    )
    renderPage()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'dr' } })
    await act(() => vi.advanceTimersByTimeAsync(350))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'dreams' } })
    await act(() => vi.advanceTimersByTimeAsync(350))
    await act(async () =>
      pending[1]?.(new Response(JSON.stringify({ results: [result('2')] }), { status: 200 })),
    )
    await act(async () =>
      pending[0]?.(new Response(JSON.stringify({ results: [result('1')] }), { status: 200 })),
    )
    await act(() => Promise.resolve())
    expect(screen.getByText('song 2')).toBeInTheDocument()
    expect(screen.queryByText('song 1')).not.toBeInTheDocument()
  })

  it('renders empty and upstream failure states', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 502 }))
    vi.stubGlobal('fetch', fetchMock)
    renderPage()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nothing' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350)
      await Promise.resolve()
    })
    expect(screen.getByText('no songs found.')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'failure' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350)
      await Promise.resolve()
    })
    expect(screen.getByText("we couldn't search for songs.")).toBeInTheDocument()
  })

  it('disables duplicates and additions once three songs are selected', async () => {
    useDraftStore.setState({ songs: [result('1'), result('2'), result('3')] })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ results: [result('1'), result('4')] }), { status: 200 }),
        ),
    )
    renderPage()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'songs' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350)
      await Promise.resolve()
    })
    expect(screen.getByRole('button', { name: 'added' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'add' })).toBeDisabled()
  })

  it('removes songs and clears an active removed track', () => {
    useDraftStore.setState({
      songs: [result('1')],
      player: { activeTrackId: '1', positionSeconds: 8, isPlaying: false },
    })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(useDraftStore.getState().songs).toEqual([])
    expect(useDraftStore.getState().player).toEqual(initialDraft.player)
  })
})
