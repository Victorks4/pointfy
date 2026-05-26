import { createClient } from '@supabase/supabase-js'
import { assertSupabaseUrl } from '@/lib/supabase/env'

/** Cliente com service_role — apenas em Server Actions/API admin. */
export function createAdminClient() {
  const url = assertSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL são obrigatórios no servidor')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
