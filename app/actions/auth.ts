'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/server/auth'
import { clearMustChangePassword } from '@/lib/server/services/usuario.service'
import { parseInput } from '@/lib/validations/parse'
import { changePasswordSchema } from '@/lib/validations/schemas'
import { runAction } from '@/lib/server/action-result'

export type SignInResult =
  | { ok: true; cargo: import('@/lib/types').UserRole; mustChangePassword: boolean }
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

  return { ok: true, cargo: profile.cargo, mustChangePassword: profile.mustChangePassword }
}

export async function changePasswordAction(senha: string, confirmacao: string) {
  return runAction<void>(async () => {
    parseInput(changePasswordSchema, { senha, confirmacao })
    const supabase = await createClient()
    const session = await getSessionUser()
    if (!session) throw new Error('Não autenticado')

    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) throw error
    await clearMustChangePassword(session.id)
    revalidatePath('/dashboard', 'layout')
  })
}

/** Encerra a sessão no servidor (limpa cookies HTTP). */
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
