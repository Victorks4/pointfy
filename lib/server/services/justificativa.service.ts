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

  let gestorId: string | null = null
  if (parsed.tipo === 'compensacao') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gestor_id, nome')
      .eq('id', session.id)
      .single()
    const profileRow = profile as Pick<ProfileRow, 'gestor_id' | 'nome'> | null
    gestorId = profileRow?.gestor_id ?? null
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
        status_compensacao: 'pendente_gestor',
        gestor_id: gestorId,
      })
      .select()
      .single()

    if (error) throw error

    if (gestorId) {
      const admin = createAdminClient()
      const { error: notifError } = await admin.from('notificacoes').insert({
        user_id: gestorId,
        titulo: 'Compensação pendente de aprovação',
        mensagem: `${estagiarioNome} solicitou compensação para a data ${parsed.data}. Abra "Meus estagiários" para aprovar ou rejeitar.`,
      })
      if (notifError) console.error('notificacao gestor:', notifError.message)
    }

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
): Promise<{ ok: true } | { ok: false; reason: string }> {
  parseInput(compensacaoDecisionSchema, { justificativaId })
  const gestor = await requireRole('gestor', 'admin')
  const supabase = await createClient()

  const { data: j, error } = await supabase
    .from('justificativas')
    .select('*, profiles!justificativas_user_id_fkey(gestor_id)')
    .eq('id', justificativaId)
    .single()

  if (error || !j) return { ok: false, reason: 'nao_encontrada' }
  const row = j as JustificativaRow & { profiles?: { gestor_id: string | null } }

  if (row.tipo !== 'compensacao') return { ok: false, reason: 'nao_encontrada' }
  if (gestor.cargo === 'gestor') {
    const { data: est } = await supabase
      .from('profiles')
      .select('gestor_id')
      .eq('id', row.user_id)
      .single()
    if ((est as ProfileRow | null)?.gestor_id !== gestor.id)
      return { ok: false, reason: 'nao_autorizado' }
  }
  if (row.status_compensacao !== 'pendente_gestor') return { ok: false, reason: 'ja_decidida' }

  const { error: upErr } = await supabase
    .from('justificativas')
    .update({
      status_compensacao: 'aprovada_gestor',
      minutos_abatidos: -MINUTOS_COMPENSACAO,
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

  if (row.tipo !== 'compensacao') return { ok: false, reason: 'nao_encontrada' }
  if (gestor.cargo === 'gestor') {
    const { data: est } = await supabase
      .from('profiles')
      .select('gestor_id')
      .eq('id', row.user_id)
      .single()
    if ((est as ProfileRow | null)?.gestor_id !== gestor.id)
      return { ok: false, reason: 'nao_autorizado' }
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
  const { data: team } = await supabase
    .from('profiles')
    .select('id')
    .eq('gestor_id', gestorId)
    .eq('cargo', 'estagiario')

  const ids = (team ?? []).map((t: { id: string }) => t.id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('justificativas')
    .select(JUSTIFICATIVA_COLUMNS)
    .eq('tipo', 'compensacao')
    .eq('status_compensacao', 'pendente_gestor')
    .in('user_id', ids)

  if (error) throw error
  return mapJustificativasWithSignedUrls(supabase, data as JustificativaRow[], true)
}

export async function listCompensacoesHistoricoGestor(gestorId: string) {
  const supabase = await createClient()
  const { data: team } = await supabase
    .from('profiles')
    .select('id')
    .eq('gestor_id', gestorId)

  const ids = (team ?? []).map((t: { id: string }) => t.id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('justificativas')
    .select(JUSTIFICATIVA_COLUMNS)
    .eq('tipo', 'compensacao')
    .in('user_id', ids)
    .order('created_at', { ascending: false })

  if (error) throw error
  return mapJustificativasWithSignedUrls(supabase, data as JustificativaRow[], true)
}
