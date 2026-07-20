import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ApiError } from './http'

let client: SupabaseClient | undefined

export function getServerSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new ApiError(503, 'service_unavailable', 'service is not configured')
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

export function resetServerSupabaseForTests() {
  client = undefined
}
