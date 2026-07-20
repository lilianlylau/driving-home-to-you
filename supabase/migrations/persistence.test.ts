import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260720000000_phase_6_persistence.sql'),
  'utf8',
)

describe('persistence migration contract', () => {
  it('enables RLS without granting anonymous table or function access', () => {
    expect(migration).toContain('alter table public.drives enable row level security')
    expect(migration).toContain('alter table public.drive_songs enable row level security')
    expect(migration).toContain('revoke all on public.drives, public.drive_songs')
    expect(migration).toContain('from public, anon, authenticated')
    expect(migration).not.toMatch(/create policy/iu)
  })

  it('keeps voice storage private and drive creation transactional', () => {
    expect(migration).toContain("'voice-memos', 'voice-memos', false")
    expect(migration).toContain('create or replace function public.create_drive_with_songs')
    expect(migration).toContain('unique (drive_id, source, source_track_id)')
  })
})
