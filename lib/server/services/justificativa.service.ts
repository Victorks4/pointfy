import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapJustificativa } from '@/lib/server/mappers'
import { requireAuth, requireRole } from '@/lib/server/auth'
import { assertTargetUserAccess } from '@/lib/server/access-control'
import { parseInput } from '@/lib/validations/parse'
import { compensacaoDecisionSchema, justificativaInputSchema } from '@/lib/validations/schemas'
import { JUSTIFICATIVA_COLUMNS } from '@/lib/server/query-columns'
import { signedUrlsForPaths, signedUrlForPath } from '@/lib/server/storage-signed-urls'
import { MINUTOS_COMPENSACAO } from '@/lib/types'
import type { Justificativa } from '@/lib/types'
import type { JustificativaRow, ProfileRow } from '@/lib/server/db-types'
import { isGestorOfEstagiario } from '@/lib/server/access-control'
import { isCompensacaoTipo } from '@/lib/compensacao-utils'
import { formatMinutesToDisplay } from '@/lib/time-utils'

async function getEstagiarioTeamIds(
  supabase: SupabaseClient,
  gestorId: string,
): Promise<string[]> {
  const { data: links } = await supabase
    .from('estagiario_gestores')
    .select('estagiario_id')
    .eq('gestor_id', gestorId)
  const linkedIds = (links ?? []).map((l: { estagiario_id: string }) => l.estagiario_id)

  const { data: team } = await supabase
    .from('profiles')
    .select('id')
    .eq('gestor_id', gestorId)
    .eq('cargo', 'estagiario')

  const ids = new Set<string>([
    ...(team ?? []).map((t: { id: string }) => t.id),
    ...linkedIds,
  ])
  return [...ids]
}

async function notifyGestorCompensacao(
  supabase: SupabaseClient,
  gestorId: string | null,
  estagiarioNome: string,
  parsed: { data: string; tipo: string; dataCompensacao?: string | null; minutosSolicitados?: number | null },
) {
  if (!gestorId) return
  const admin = createAdminClient()
  const parcial = parsed.tipo === 'compensacao_parcial'
  const msg = parcial
    ? `${estagiarioNome} solicitou compensação parcial (${formatMinutesToDisplay(parsed.minutosSolicitados ?? 0)} em ${parsed.dataCompensacao}) para falta em ${parsed.data}.`
    : `${estagiarioNome} solicitou compensação para a data ${parsed.data}. Abra "Meus estagiários" para aprovar ou rejeitar.`
  const { error: notifError } = await admin.from('notificacoes').insert({
    user_id: gestorId,
    titulo: parcial ? 'Compensação parcial pendente' : 'Compensação pendente de aprovação',
    mensagem: msg,
  })
  if (notifError) console.error('notificacao gestor:', notifError.message)
}

async function mapJustificativasWithSignedUrls(
  supabase: SupabaseClient,
  rows: JustificativaRow[],
  signFiles: boolean,
): Promise<Justificativa[]> {
  if (!signFiles) {
    return rows.map((r) => mapJustificativa(r, null))
  }
  const urlMap = await signedUrlsForPaths(
    supabase,
    rows.map((r) => r.arquivo_path),
  )
  return rows.map((r) =>
    mapJustificativa(r, r.arquivo_path ? urlMap.get(r.arquivo_path) ?? null : null),
  )
}

export async function listJustificativas(
  userId?: string,
  options?: { signFiles?: boolean },
): Promise<Justificativa[]> {
  const session = await requireAuth()
  const supabase = await createClient()
  const targetId = userId ?? session.id
  await assertTargetUserAccess(session, targetId, supabase)

  const { data, error } = await supabase
    .from('justificativas')
    .select(JUSTIFICATIVA_COLUMNS)
    .eq('user_id', targetId)
    .order('data', { ascending: false })

  if (error) throw error
  return mapJustificativasWithSignedUrls(
    supabase,
    data as JustificativaRow[],
    options?.signFiles ?? true,
  )
}

export async function listJustificativasRh(): Promise<Justificativa[]> {
  await requireRole('admin')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('justificativas')
    .select(JUSTIFICATIVA_COLUMNS)
    .or('tipo.eq.atestado,and(tipo.eq.compensacao,status_compensacao.eq.aprovada_gestor)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return mapJustificativasWithSignedUrls(supabase, data as JustificativaRow[], true)
}

export async function createJustificativa(input: unknown): Promise<Justificativa> {
  const session = await requireAuth()
  const parsed = parseInput(justificativaInputSchema, input)
  const supabase = await createClient()

  if (isCompensacaoTipo(parsed.tipo)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gestor_id, nome')
      .eq('id', session.id)
      .single()
    const profileRow = profile as Pick<ProfileRow, 'gestor_id' | 'nome'> | null
    const gestorId = profileRow?.gestor_id ?? null
    const estagiarioNome = profileRow?.nome ?? session.nome

    const { data, error } = await supabase
      .from('justificativas')
      .insert({
        user_id: session.id,
        data: parsed.data,
        tipo: parsed.tipo,
        descricao: parsed.descricao,
        arquivo_path: parsed.arquivoPath ?? null,
        minutos_abatidos: 0,
        data_compensacao: parsed.dataCompensacao ?? null,
        minutos_solicitados: parsed.minutosSolicitados ?? null,
        status_compensacao: 'pendente_gestor',
        gestor_id: gestorId,
      })
      .select()
      .single()

    if (error) throw error
    await notifyGestorCompensacao(supabase, gestorId, estagiarioNome, parsed)

    const row = data as JustificativaRow
    const arquivoUrl = await signedUrlForPath(supabase, row.arquivo_path)
    return mapJustificativa(row, arquivoUrl)
  }

  const { data, error } = await supabase
    .from('justificativas')
    .insert({
      user_id: session.id,
      data: parsed.data,
      tipo: parsed.tipo,
      descricao: parsed.descricao,
      arquivo_path: parsed.arquivoPath ?? null,
      minutos_abatidos: 0,
    })
    .select()
    .single()

  if (error) throw error
  const row = data as JustificativaRow
  const arquivoUrl = await signedUrlForPath(supabase, row.arquivo_path)
  return mapJustificativa(row, arquivoUrl)
}

export async function aprovarCompensacao(
  justificativaId: string,
  minutosAprovados?: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  parseInput(compensacaoDecisionSchema, { justificativaId, minutosAprovados })
  const gestor = await requireRole('gestor', 'admin')
  const supabase = await createClient()

  const { data: j, error } = await supabase
    .from('justificativas')
    .select('*')
    .eq('id', justificativaId)
    .single()

  if (error || !j) return { ok: false, reason: 'nao_encontrada' }
  const row = j as JustificativaRow

  if (!isCompensacaoTipo(row.tipo)) return { ok: false, reason: 'nao_encontrada' }
  if (gestor.cargo === 'gestor') {
    const allowed = await isGestorOfEstagiario(supabase, gestor.id, row.user_id)
    if (!allowed) return { ok: false, reason: 'nao_autorizado' }
  }
  if (row.status_compensacao !== 'pendente_gestor') return { ok: false, reason: 'ja_decidida' }

  const minutos =
    row.tipo === 'compensacao_parcial'
      ? -(minutosAprovados ?? row.minutos_solicitados ?? 0)
      : -MINUTOS_COMPENSACAO

  const { error: upErr } = await supabase
    .from('justificativas')
    .update({
      status_compensacao: 'aprovada_gestor',
      minutos_abatidos: minutos,
      decidida_em: new Date().toISOString(),
    })
    .eq('id', justificativaId)

  if (upErr) throw upErr

  await supabase.from('notificacoes').insert({
    user_id: row.user_id,
    titulo: 'Compensação aprovada',
    mensagem: 'Sua solicitação de compensação foi aprovada pelo gestor.',
  })

  return { ok: true }
}

export async function rejeitarCompensacao(
  justificativaId: string,
  motivoRejeicao?: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  parseInput(compensacaoDecisionSchema, { justificativaId, motivoRejeicao })
  const gestor = await requireRole('gestor', 'admin')
  const supabase = await createClient()

  const { data: j, error } = await supabase
    .from('justificativas')
    .select('*')
    .eq('id', justificativaId)
    .single()

  if (error || !j) return { ok: false, reason: 'nao_encontrada' }
  const row = j as JustificativaRow

  if (!isCompensacaoTipo(row.tipo)) return { ok: false, reason: 'nao_encontrada' }
  if (gestor.cargo === 'gestor') {
    const allowed = await isGestorOfEstagiario(supabase, gestor.id, row.user_id)
    if (!allowed) return { ok: false, reason: 'nao_autorizado' }
  }
  if (row.status_compensacao !== 'pendente_gestor') return { ok: false, reason: 'ja_decidida' }

  const motivo = motivoRejeicao?.trim() || null
  const { error: upErr } = await supabase
    .from('justificativas')
    .update({
      status_compensacao: 'rejeitada_gestor',
      minutos_abatidos: 0,
      decidida_em: new Date().toISOString(),
      motivo_rejeicao: motivo,
    })
    .eq('id', justificativaId)

  if (upErr) throw upErr

  await supabase.from('notificacoes').insert({
    user_id: row.user_id,
    titulo: 'Compensação não aprovada',
    mensagem: motivo
      ? `Sua compensação foi rejeitada: ${motivo}`
      : 'Sua solicitação de compensação foi rejeitada pelo gestor.',
  })

  return { ok: true }
}

export async function listCompensacoesPendentesGestor(gestorId: string) {
  const supabase = await createClient()
  const ids = await getEstagiarioTeamIds(supabase, gestorId)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('justificativas')
    .select(JUSTIFICATIVA_COLUMNS)
    .in('tipo', ['compensacao', 'compensacao_parcial'])
    .eq('status_compensacao', 'pendente_gestor')
    .in('user_id', ids)

  if (error) throw error
  return mapJustificativasWithSignedUrls(supabase, data as JustificativaRow[], true)
}

export async function listCompensacoesHistoricoGestor(gestorId: string) {
  const supabase = await createClient()
  const ids = await getEstagiarioTeamIds(supabase, gestorId)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('justificativas')
    .select(JUSTIFICATIVA_COLUMNS)
    .in('tipo', ['compensacao', 'compensacao_parcial'])
    .in('user_id', ids)
    .order('created_at', { ascending: false })

  if (error) throw error
  return mapJustificativasWithSignedUrls(supabase, data as JustificativaRow[], true)
}
