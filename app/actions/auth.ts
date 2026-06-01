'use server'

import { createClient } from '@/lib/supabase/server'

/** Encerra a sessão no servidor (limpa cookies HTTP). */
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
