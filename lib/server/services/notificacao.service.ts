import { createClient } from '@/lib/supabase/server'
import { mapNotificacao } from '@/lib/server/mappers'
import { requireAuth, requireRole } from '@/lib/server/auth'
import { notificacaoInputSchema } from '@/lib/validations/schemas'
import type { Notificacao } from '@/lib/types'
import type { NotificacaoRow } from '@/lib/server/db-types'

export async function listNotificacoesForUser(userId: string): Promise<Notificacao[]> {
  await requireAuth()
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('notificacoes')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error

  const { data: leituras } = await supabase
    .from('notificacao_leituras')
    .select('notificacao_id')
    .eq('user_id', userId)

  const lidas = new Set((leituras ?? []).map((l: { notificacao_id: string }) => l.notificacao_id))

  return (rows as NotificacaoRow[]).map((r) => mapNotificacao(r, lidas.has(r.id)))
}

export async function createNotificacao(input: unknown): Promise<Notificacao> {
  await requireRole('admin')
  const parsed = notificacaoInputSchema.parse(input)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notificacoes')
    .insert({
      user_id: parsed.userId,
      titulo: parsed.titulo,
      mensagem: parsed.mensagem,
    })
    .select()
    .single()

  if (error) throw error
  return mapNotificacao(data as NotificacaoRow, false)
}

export async function markNotificacaoAsRead(notificacaoId: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('notificacao_leituras').upsert({
    notificacao_id: notificacaoId,
    user_id: userId,
  })
  if (error) throw error
}
