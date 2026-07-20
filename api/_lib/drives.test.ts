import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createDrive } from './drives'

const input = {
  noteText: 'hello',
  songs: [
    {
      id: '1',
      title: 'Song',
      artist: 'Artist',
      audioUrl: 'https://audio-ssl.itunes.apple.com/1',
    },
  ],
}

function fakeClient(errors: Array<{ code: string; message: string } | null>) {
  const upload = vi.fn().mockResolvedValue({ error: null })
  const remove = vi.fn().mockResolvedValue({ error: null })
  const rpc = vi.fn().mockImplementation(async () => ({ error: errors.shift() ?? null }))
  return {
    client: { rpc, storage: { from: () => ({ upload, remove }) } } as unknown as SupabaseClient,
    rpc,
    upload,
    remove,
  }
}

describe('atomic drive creation', () => {
  it('retries a short-id collision', async () => {
    const fake = fakeClient([{ code: '23505', message: 'drives_short_id_key' }, null])
    await expect(createDrive(fake.client, input, undefined, 's'.repeat(32))).resolves.toMatchObject(
      { shortId: expect.any(String), deletionToken: expect.any(String) },
    )
    expect(fake.rpc).toHaveBeenCalledTimes(2)
  })

  it('removes a new upload when the transaction fails', async () => {
    const fake = fakeClient([{ code: '22023', message: 'invalid songs' }])
    await expect(
      createDrive(
        fake.client,
        input,
        { data: Buffer.from('voice'), mimeType: 'audio/webm', durationMs: 1000, extension: 'webm' },
        's'.repeat(32),
      ),
    ).rejects.toThrow('could not be created')
    expect(fake.upload).toHaveBeenCalledOnce()
    expect(fake.remove).toHaveBeenCalledOnce()
  })
})
