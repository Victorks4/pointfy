import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@/lib/types'

/** Regra pura: sessão pode ver dados do targetUserId? */
export function canAccessUserData(
  session: User,
  targetUserId: string,
  targetGestorId: string | null,
  linkedGestorIds?: string[],
): boolean {
  if (session.cargo === 'admin') return true
  if (session.id === targetUserId) return true
  if (session.cargo === 'gestor') {
    if (targetGestorId === session.id) return true
    if (linkedGestorIds?.includes(session.id)) return true
  }
  return false
}

export function assertCanAccessUserData(
  session: User,
  targetUserId: string,
  targetGestorId: string | null,
  linkedGestorIds?: string[],
): void {
  if (!canAccessUserData(session, targetUserId, targetGestorId, linkedGestorIds)) {
    throw new Error('Sem permissão')
  }
}

async function loadLinkedGestorIds(
  supabase: SupabaseClient,
  targetUserId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('estagiario_gestores')
    .select('gestor_id')
    .eq('estagiario_id', targetUserId)
  if (error) throw error
  return (data ?? []).map((r: { gestor_id: string }) => r.gestor_id)
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
    const linked = await loadLinkedGestorIds(supabase, targetUserId)
    assertCanAccessUserData(session, targetUserId, gestorId, linked)
    return
  }

  throw new Error('Sem permissão')
}

export async function isGestorOfEstagiario(
  supabase: SupabaseClient,
  gestorId: string,
  estagiarioId: string,
): Promise<boolean> {
  const { data: est } = await supabase
    .from('profiles')
    .select('gestor_id')
    .eq('id', estagiarioId)
    .single()
  const principal = (est as { gestor_id: string | null } | null)?.gestor_id
  if (principal === gestorId) return true
  const linked = await loadLinkedGestorIds(supabase, estagiarioId)
  return linked.includes(gestorId)
}
