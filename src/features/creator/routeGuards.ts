import type { CreatorStep } from '../../stores/draft'

export function firstIncompleteRoute(
  songsValid: boolean,
  noteValid: boolean,
  targetStep: CreatorStep,
) {
  if (targetStep > 1 && !songsValid) return '/create/mixtape'
  if (targetStep > 2 && !noteValid) return '/create/letter'
  return null
}
