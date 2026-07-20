import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import {
  isValidNote,
  isValidSongSelection,
  useDraftStore,
  type CreatorStep,
} from '../../stores/draft'
import { firstIncompleteRoute } from './routeGuards'

export function CreatorRouteGuard({ step, children }: { step: CreatorStep; children: ReactNode }) {
  const songs = useDraftStore((state) => state.songs)
  const noteText = useDraftStore((state) => state.noteText)
  const redirect = firstIncompleteRoute(isValidSongSelection(songs), isValidNote(noteText), step)
  return redirect ? <Navigate replace to={redirect} /> : children
}
