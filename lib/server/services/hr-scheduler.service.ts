import { createAdminClient } from '@/lib/supabase/admin'
import { sendHrAlertEmail } from '@/lib/server/email/send-hr-alert'
import { ALERTA_ANTECEDENCIA_DIAS, formatDate, formatDateShort, isRecessApproaching } from '@/lib/time-utils'
import { PROFILE_COLUMNS } from '@/lib/server/query-columns'
import type { ProfileRow } from '@/lib/server/db-types'

export const RECESSO_LEMBRETE_DIAS = ALERTA_ANTECEDENCIA_DIAS

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

async function insertNotification(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  titulo: string,
  mensagem: string,
): Promise<void> {
  if (await notificationExists(admin, userId, titulo)) return
  await admin.from('notificacoes').insert({
    user_id: userId,
    titulo,
    mensagem,
  })
}

async function loadGestorIdsForEstagiario(
  admin: ReturnType<typeof createAdminClient>,
  estagiarioId: string,
  gestorPrincipal: string | null,
): Promise<string[]> {
  const ids = new Set<string>()
  if (gestorPrincipal) ids.add(gestorPrincipal)
  const { data } = await admin
    .from('estagiario_gestores')
    .select('gestor_id')
    .eq('estagiario_id', estagiarioId)
  for (const row of data ?? []) {
    ids.add(row.gestor_id as string)
  }
  return [...ids]
}

async function notifyGestores(
  admin: ReturnType<typeof createAdminClient>,
  estagiario: ProfileRow,
  titulo: string,
  mensagem: string,
  emailSubject: string,
  emailBody: string,
): Promise<void> {
  const gestorIds = await loadGestorIdsForEstagiario(admin, estagiario.id, estagiario.gestor_id)
  for (const gestorId of gestorIds) {
    await insertNotification(admin, gestorId, titulo, mensagem)
    const { data: gestor } = await admin
      .from('profiles')
      .select('email')
      .eq('id', gestorId)
      .maybeSingle()
    if (gestor?.email) {
      await sendHrAlertEmail({
        to: gestor.email,
        subject: emailSubject,
        html: `<p>${mensagem}</p>`,
        text: mensagem,
      })
    }
  }
}

function isActiveEstagiario(row: ProfileRow): boolean {
  return row.cargo === 'estagiario' && (row.ativo ?? true)
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
  await insertNotification(
    admin,
    userId,
    titulo,
    `Seu recesso ${numero} foi agendado de ${formatDate(inicio)} até ${formatDate(fim)}.`,
  )
}

/** Lembretes antes do início dos recessos (estagiário + gestores). */
export async function checkUpcomingRecessos(
  daysAhead: number = RECESSO_LEMBRETE_DIAS,
): Promise<void> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('cargo', 'estagiario')
    .eq('ativo', true)
  if (error) throw error

  for (const row of (data as ProfileRow[]) ?? []) {
    if (!isActiveEstagiario(row)) continue
    const periods = [
      { n: 1 as const, inicio: row.data_inicio_recesso_1, fim: row.data_fim_recesso_1 },
      { n: 2 as const, inicio: row.data_inicio_recesso_2, fim: row.data_fim_recesso_2 },
    ]
    for (const p of periods) {
      if (!p.inicio || !isRecessApproaching(p.inicio, daysAhead)) continue

      const tituloEst = `Recesso ${p.n} em ${daysAhead} dias`
      const msgEst = `Seu recesso ${p.n} começa em ${formatDateShort(p.inicio)}${p.fim ? ` e vai até ${formatDateShort(p.fim)}` : ''}.`
      await insertNotification(admin, row.id, tituloEst, msgEst)

      if (row.email) {
        await sendHrAlertEmail({
          to: row.email,
          subject: tituloEst,
          html: `<p>${msgEst}</p>`,
          text: msgEst,
        })
      }

      const tituloGestor = `${row.nome} — recesso ${p.n} em ${daysAhead} dias`
      const msgGestor = `O estagiário ${row.nome} (${row.matricula}) inicia o recesso ${p.n} em ${formatDateShort(p.inicio)}.`
      await notifyGestores(admin, row, tituloGestor, msgGestor, tituloGestor, msgGestor)
    }
  }
}

/** Lembretes antes do término do contrato (estagiário + gestores). */
export async function checkUpcomingContractEnds(
  daysAhead: number = ALERTA_ANTECEDENCIA_DIAS,
): Promise<void> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('cargo', 'estagiario')
    .eq('ativo', true)
    .not('data_fim_contrato', 'is', null)
  if (error) throw error

  for (const row of (data as ProfileRow[]) ?? []) {
    if (!row.data_fim_contrato || !isActiveEstagiario(row)) continue
    if (!isRecessApproaching(row.data_fim_contrato, daysAhead)) continue

    const tituloEst = `Término de contrato em ${daysAhead} dias`
    const msgEst = `Seu contrato de estágio termina em ${formatDateShort(row.data_fim_contrato)}.`
    await insertNotification(admin, row.id, tituloEst, msgEst)

    if (row.email) {
      await sendHrAlertEmail({
        to: row.email,
        subject: tituloEst,
        html: `<p>${msgEst}</p>`,
        text: msgEst,
      })
    }

    const tituloGestor = `${row.nome} — contrato termina em ${daysAhead} dias`
    const msgGestor = `O contrato de estágio de ${row.nome} (${row.matricula}) termina em ${formatDateShort(row.data_fim_contrato)}.`
    await notifyGestores(admin, row, tituloGestor, msgGestor, tituloGestor, msgGestor)
  }
}

/** Lembrete 1 dia antes de feriado. */
export async function checkUpcomingFeriados(): Promise<void> {
  const admin = createAdminClient()
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
    .eq('ativo', true)

  for (const f of feriados) {
    const titulo = `Feriado amanhã: ${f.nome}`
    for (const est of estagiarios ?? []) {
      await insertNotification(
        admin,
        est.id,
        titulo,
        `Amanhã (${formatDate(f.data)}) é feriado: ${f.nome}. Não é necessário registrar ponto.`,
      )
    }
  }
}

/** Executa todos os lembretes HR (cron + fallback no login). */
export async function runAllHrReminders(): Promise<void> {
  await Promise.all([
    checkUpcomingRecessos(),
    checkUpcomingContractEnds(),
    checkUpcomingFeriados(),
  ])
}
