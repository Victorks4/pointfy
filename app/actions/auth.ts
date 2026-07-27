'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/server/auth'
import { mapProfile } from '@/lib/server/mappers'
import { clearMustChangePassword } from '@/lib/server/services/usuario.service'
import { parseInput } from '@/lib/validations/parse'
import { changePasswordSchema, passwordResetRequestSchema } from '@/lib/validations/schemas'
import { runAction } from '@/lib/server/action-result'
import { PROFILE_COLUMNS } from '@/lib/server/query-columns'
import type { ProfileRow } from '@/lib/server/db-types'
import { buildPasswordResetRedirectUrl, getSiteOrigin } from '@/lib/auth/site-origin'

export type SignInResult =
  | { ok: true; cargo: import('@/lib/types').UserRole; mustChangePassword: boolean }
  | { ok: false; error: string }

/**
 * Login no servidor — grava cookies HTTP antes do redirect (confiável em produção).
 */
export async function signInAction(email: string, password: string): Promise<SignInResult> {
  const supabase = await createClient()
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: error.message }

  const authUserId = signInData.user?.id
  if (!authUserId) {
    await supabase.auth.signOut()
    return { ok: false, error: 'Conta sem perfil configurado. Entre em contato com o administrador.' }
  }

  // Usa o mesmo client autenticado (sessão em memória), evitando falha ao reler cookies.
  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', authUserId)
    .maybeSingle()

  if (profileError) {
    console.error('[signInAction] erro ao carregar perfil:', profileError.message, profileError.code)
    await supabase.auth.signOut()
    return {
      ok: false,
      error: 'Não foi possível carregar seu perfil. Tente novamente ou contate o administrador.',
    }
  }

  if (!profileRow) {
    await supabase.auth.signOut()
    return { ok: false, error: 'Conta sem perfil configurado. Entre em contato com o administrador.' }
  }

  const profile = mapProfile(profileRow as ProfileRow)
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

/** Solicita e-mail de recuperação de senha (mensagem genérica na UI). */
export async function requestPasswordResetAction(email: string) {
  return runAction<void>(async () => {
    const { email: parsedEmail } = parseInput(passwordResetRequestSchema, { email })
    const supabase = await createClient()
    const origin = await getSiteOrigin()
    const redirectTo = buildPasswordResetRedirectUrl(origin)

    const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail, { redirectTo })
    if (error) throw error
  })
}

/** Conclui redefinição de senha após link de recuperação. */
export async function completePasswordResetAction(senha: string, confirmacao: string) {
  return runAction<void>(async () => {
    parseInput(changePasswordSchema, { senha, confirmacao })
    const supabase = await createClient()
    const session = await getSessionUser()
    if (!session) throw new Error('Sessão inválida ou expirada. Solicite um novo link de recuperação.')

    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) throw error

    await supabase.auth.signOut()
  })
}
