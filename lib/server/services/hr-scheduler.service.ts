import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/time-utils'
import { isRecessApproaching } from '@/lib/time-utils'
import { PROFILE_COLUMNS } from '@/lib/server/query-columns'
import type { ProfileRow } from '@/lib/server/db-types'

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateStr}T00:00:00`)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

async function notificationExists(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  titulo: string,
): Promise<boolean> {
  const { data } = await admin
    .from('notificacoes')
    .select('id')
    .eq('user_id', userId)
    .eq('titulo', titulo)
    .limit(1)
  return (data?.length ?? 0) > 0
}

/** Notifica estagiário sobre recesso cadastrado/alterado. */
export async function notifyRecessoCadastrado(
  userId: string,
  inicio: string,
  fim: string,
  numero: 1 | 2,
): Promise<void> {
  const admin = createAdminClient()
  const titulo = `Recesso ${numero} agendado`
  if (await notificationExists(admin, userId, titulo)) return
  await admin.from('notificacoes').insert({
    user_id: userId,
    titulo,
    mensagem: `Seu recesso ${numero} foi agendado de ${formatDate(inicio)} até ${formatDate(fim)}.`,
  })
}

/** Lembretes 15 dias antes do início dos recessos. */
export const RECESSO_LEMBRETE_DIAS = 15

/** Lembretes antes do início dos recessos. */
export async function checkUpcomingRecessos(
  daysAhead: number = RECESSO_LEMBRETE_DIAS,
): Promise<void> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('cargo', 'estagiario')
  if (error) throw error

  for (const row of (data as ProfileRow[]) ?? []) {
    const periods = [
      { n: 1 as const, inicio: row.data_inicio_recesso_1, fim: row.data_fim_recesso_1 },
      { n: 2 as const, inicio: row.data_inicio_recesso_2, fim: row.data_fim_recesso_2 },
    ]
    for (const p of periods) {
      if (!p.inicio || !isRecessApproaching(p.inicio, daysAhead)) continue
      const titulo = `Recesso ${p.n} em ${daysAhead} dias`
      if (await notificationExists(admin, row.id, titulo)) continue
      await admin.from('notificacoes').insert({
        user_id: row.id,
        titulo,
        mensagem: `Seu recesso ${p.n} começa em ${formatDate(p.inicio)}${p.fim ? ` e vai até ${formatDate(p.fim)}` : ''}.`,
      })
    }
  }
}

/** Lembrete 1 dia antes de feriado. */
export async function checkUpcomingFeriados(): Promise<void> {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: feriados, error } = await admin
    .from('feriados')
    .select('data, nome')
    .eq('data', tomorrowStr)
  if (error) throw error
  if (!feriados?.length) return

  const { data: estagiarios } = await admin
    .from('profiles')
    .select('id')
    .eq('cargo', 'estagiario')

  for (const f of feriados) {
    const titulo = `Feriado amanhã: ${f.nome}`
    for (const est of estagiarios ?? []) {
      if (await notificationExists(admin, est.id, titulo)) continue
      await admin.from('notificacoes').insert({
        user_id: est.id,
        titulo,
        mensagem: `Amanhã (${formatDate(f.data)}) é feriado: ${f.nome}. Não é necessário registrar ponto.`,
      })
    }
  }

  void today
}
