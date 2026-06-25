import { createClient } from '@/lib/supabase/server'
import { getCachedPontoConfigs } from '@/lib/server/cached-static-data'
import { mapPonto, mapProfile, pontoToInsert } from '@/lib/server/mappers'
import { mapBloqueio } from '@/lib/server/mappers'
import { mapPontoConfig } from '@/lib/server/mappers'
import { requireAuth } from '@/lib/server/auth'
import { parseInput } from '@/lib/validations/parse'
import { pontoInputSchema, pontoUpdateSchema } from '@/lib/validations/schemas'
import {
  PROFILE_COLUMNS,
  PONTO_COLUMNS,
  BLOQUEIO_COLUMNS,
} from '@/lib/server/query-columns'
import {
  assertPontoBusinessRules,
  type PontoFieldsInput,
} from '@/lib/server/validators/ponto.validator'
import type { PontoRegistro, PontoConfig } from '@/lib/types'
import type {
  PontoRegistroRow,
  ProfileRow,
  BloqueioPresencaRow,
  PontoConfigRow,
} from '@/lib/server/db-types'

async function loadPontoValidationContext(userId: string, dataRef: string) {
  const session = await requireAuth()
  if (session.cargo !== 'admin' && session.id !== userId) {
    throw new Error('Sem permissão para registrar ponto deste usuário')
  }

  const supabase = await createClient()

  const [profileRes, bloqueiosRes, configs] = await Promise.all([
    supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).single(),
    supabase
      .from('bloqueios_presenca')
      .select(BLOQUEIO_COLUMNS)
      .eq('user_id', userId)
      .lte('data_inicio', dataRef)
      .gte('data_fim', dataRef),
    getCachedPontoConfigs(supabase),
  ])

  if (profileRes.error || !profileRes.data) {
    throw new Error('Perfil do usuário não encontrado')
  }

  const user = mapProfile(profileRes.data as ProfileRow)
  const bloqueios = (bloqueiosRes.data as BloqueioPresencaRow[] ?? []).map(mapBloqueio)
  const activeConfig =
    configs.find((c) => c.ativo) ?? configs.find((c) => c.padrao) ?? defaultPontoConfig()

  return { user, bloqueios, activeConfig }
}

function defaultPontoConfig(): PontoConfig {
  return {
    id: 'default',
    nome: 'Padrão (6h/dia)',
    metaDiariaMinutos: 360,
    limiteMinutosSemJustificativa: 370,
    rejeitarMinutosZero: true,
    formatoDecimal: 'americano',
    horarioEntradaEsperado: '09:00',
    ativo: true,
    padrao: true,
    createdAt: new Date().toISOString(),
  }
}

function toPontoFields(parsed: {
  data: string
  entrada1?: string | null
  saida1?: string | null
  entrada2?: string | null
  saida2?: string | null
  totalMinutos: number
  justificativaHoraExtra?: string | null
}): PontoFieldsInput {
  return {
    data: parsed.data,
    entrada1: parsed.entrada1 ?? null,
    saida1: parsed.saida1 ?? null,
    entrada2: parsed.entrada2 ?? null,
    saida2: parsed.saida2 ?? null,
    totalMinutos: parsed.totalMinutos,
    justificativaHoraExtra: parsed.justificativaHoraExtra ?? null,
  }
}

export async function listPontos(userId?: string): Promise<PontoRegistro[]> {
  const session = await requireAuth()
  const supabase = await createClient()
  const targetId = userId ?? session.id

  const { data, error } = await supabase
    .from('ponto_registros')
    .select(PONTO_COLUMNS)
    .eq('user_id', targetId)
    .order('data', { ascending: false })

  if (error) throw error
  return (data as PontoRegistroRow[]).map(mapPonto)
}

export async function getPontoByDate(userId: string, data: string) {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('ponto_registros')
    .select(PONTO_COLUMNS)
    .eq('user_id', userId)
    .eq('data', data)
    .maybeSingle()

  if (error) throw error
  return row ? mapPonto(row as PontoRegistroRow) : undefined
}

export async function createPonto(
  input: unknown,
  userId?: string,
): Promise<PontoRegistro> {
  const session = await requireAuth()
  if (session.cargo !== 'estagiario' && session.cargo !== 'admin') {
    throw new Error('Apenas estagiários podem registrar ponto')
  }

  const parsed = parseInput(pontoInputSchema, input)
  const uid = userId ?? session.id
  const ctx = await loadPontoValidationContext(uid, parsed.data)

  const fields = toPontoFields(parsed)
  assertPontoBusinessRules(fields, ctx)

  const supabase = await createClient()
  const row = pontoToInsert({
    userId: uid,
    data: parsed.data,
    entrada1: fields.entrada1,
    saida1: fields.saida1,
    entrada2: fields.entrada2,
    saida2: fields.saida2,
    totalMinutos: fields.totalMinutos,
    observacao: parsed.observacao ?? null,
    justificativaHoraExtra: fields.justificativaHoraExtra,
  })

  const { data, error } = await supabase
    .from('ponto_registros')
    .insert(row)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe registro de ponto para esta data')
    }
    throw error
  }
  return mapPonto(data as PontoRegistroRow)
}

export async function updatePonto(id: string, input: unknown): Promise<PontoRegistro> {
  const session = await requireAuth()
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('ponto_registros')
    .select(PONTO_COLUMNS)
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new Error('Registro de ponto não encontrado')
  }

  const current = mapPonto(existing as PontoRegistroRow)
  if (session.cargo !== 'admin' && current.userId !== session.id) {
    throw new Error('Sem permissão para editar este registro')
  }

  const partial = parseInput(pontoUpdateSchema, input)
  const merged = {
    data: partial.data ?? current.data,
    entrada1: partial.entrada1 !== undefined ? partial.entrada1 : current.entrada1,
    saida1: partial.saida1 !== undefined ? partial.saida1 : current.saida1,
    entrada2: partial.entrada2 !== undefined ? partial.entrada2 : current.entrada2,
    saida2: partial.saida2 !== undefined ? partial.saida2 : current.saida2,
    totalMinutos: partial.totalMinutos ?? current.totalMinutos,
    justificativaHoraExtra:
      partial.justificativaHoraExtra !== undefined
        ? partial.justificativaHoraExtra
        : current.justificativaHoraExtra,
    observacao: partial.observacao !== undefined ? partial.observacao : current.observacao,
  }

  const ctx = await loadPontoValidationContext(current.userId, merged.data)
  const fields = toPontoFields(merged)
  assertPontoBusinessRules(fields, ctx)

  const { data, error } = await supabase
    .from('ponto_registros')
    .update({
      data: merged.data,
      entrada1: merged.entrada1,
      saida1: merged.saida1,
      entrada2: merged.entrada2,
      saida2: merged.saida2,
      total_minutos: merged.totalMinutos,
      observacao: merged.observacao,
      justificativa_hora_extra: merged.justificativaHoraExtra,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapPonto(data as PontoRegistroRow)
}
