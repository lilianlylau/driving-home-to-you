import { describe, expect, it } from 'vitest'
import { generateDeleteToken, generateShortId, hashDeleteToken, tokensMatch } from './security'

describe('drive secrets', () => {
  it('generates URL-safe short IDs with 72 bits of entropy', () => {
    expect(generateShortId()).toMatch(/^[A-Za-z0-9_-]{12}$/u)
  })

  it('stores and verifies only a keyed token hash', () => {
    const token = generateDeleteToken()
    const hash = hashDeleteToken(token, 'a'.repeat(32))
    expect(hash).toHaveLength(64)
    expect(tokensMatch(hash, token, 'a'.repeat(32))).toBe(true)
    expect(tokensMatch(hash, `${token}x`, 'a'.repeat(32))).toBe(false)
  })
})
