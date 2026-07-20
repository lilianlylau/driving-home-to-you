import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiError } from './http'

type Scope = 'global_create' | 'client_create' | 'client_read' | 'client_delete' | 'client_search'
interface RateRow {
  allowed: boolean
  remaining: number
  retry_after: number
  request_count: number
}

export async function takeRateLimit(
  client: SupabaseClient,
  scope: Scope,
  key: string,
  windowSeconds: number,
  limit: number,
) {
  const { data, error } = await client.rpc('take_rate_limit', {
    p_scope: scope,
    p_client_hash: key,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  })
  if (error) throw new ApiError(503, 'rate_limit_unavailable', 'service is temporarily unavailable')
  const row = (data as RateRow[] | null)?.[0]
  if (!row) throw new ApiError(503, 'rate_limit_unavailable', 'service is temporarily unavailable')
  if (!row.allowed)
    throw new ApiError(
      429,
      'rate_limited',
      'too many requests, please try again later',
      row.retry_after,
    )
  return row
}
