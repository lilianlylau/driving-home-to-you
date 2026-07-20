import { describe, expect, it } from 'vitest'
import { firstIncompleteRoute } from './routeGuards'

describe('creator route guards', () => {
  it('sends later steps to the earliest incomplete requirement', () => {
    expect(firstIncompleteRoute(false, false, 4)).toBe('/create/mixtape')
    expect(firstIncompleteRoute(true, false, 4)).toBe('/create/letter')
    expect(firstIncompleteRoute(true, true, 4)).toBeNull()
    expect(firstIncompleteRoute(false, false, 1)).toBeNull()
  })
})
