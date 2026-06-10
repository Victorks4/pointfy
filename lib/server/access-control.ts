import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@/lib/types'

/** Regra pura: sessão pode ver dados do targetUserId? */
export function canAccessUserData(
  session: User,
  targetUserId: string,
  targetGestorId: string | null,
): boolean {
  if (session.cargo === 'admin') return true
  if (session.id === targetUserId) return true
  if (session.cargo === 'gestor' && targetGestorId === session.id) return true
  return false
}

export function assertCanAccessUserData(
  session: User,
  targetUserId: string,
  targetGestorId: string | null,
): void {
  if (!canAccessUserData(session, targetUserId, targetGestorId)) {
    throw new Error('Sem permissão')
  }
}

/** Valida acesso consultando gestor_id do alvo no PostgREST. */
export async function assertTargetUserAccess(
  session: User,
  targetUserId: string,
  supabase: SupabaseClient,
): Promise<void> {
  if (session.cargo === 'admin' || session.id === targetUserId) return

  if (session.cargo === 'estagiario') {
    throw new Error('Sem permissão')
  }

  if (session.cargo === 'gestor') {
    const { data: est } = await supabase
      .from('profiles')
      .select('gestor_id')
      .eq('id', targetUserId)
      .single()
    const gestorId = (est as { gestor_id: string | null } | null)?.gestor_id ?? null
    assertCanAccessUserData(session, targetUserId, gestorId)
    return
  }

  throw new Error('Sem permissão')
}
