'use server'

import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/server/auth'

export type SignInResult =
  | { ok: true; cargo: import('@/lib/types').UserRole }
  | { ok: false; error: string }

/**
 * Login no servidor — grava cookies HTTP antes do redirect (confiável em produção).
 */
export async function signInAction(email: string, password: string): Promise<SignInResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: error.message }

  const profile = await getSessionUser()
  if (!profile) {
    await supabase.auth.signOut()
    return { ok: false, error: 'Conta sem perfil configurado. Entre em contato com o administrador.' }
  }

  return { ok: true, cargo: profile.cargo }
}

/** Encerra a sessão no servidor (limpa cookies HTTP). */
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
