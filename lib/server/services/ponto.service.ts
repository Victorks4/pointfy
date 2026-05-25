import { createClient } from '@/lib/supabase/server'
import { mapPonto, pontoToInsert } from '@/lib/server/mappers'
import { requireAuth } from '@/lib/server/auth'
import { pontoInputSchema } from '@/lib/validations/schemas'
import type { PontoRegistro } from '@/lib/types'
import type { PontoRegistroRow } from '@/lib/server/db-types'

export async function listPontos(userId?: string): Promise<PontoRegistro[]> {
  const session = await requireAuth()
  const supabase = await createClient()
  const targetId = userId ?? session.id

  const { data, error } = await supabase
    .from('ponto_registros')
    .select('*')
    .eq('user_id', targetId)
    .order('data', { ascending: false })

  if (error) throw error
  return (data as PontoRegistroRow[]).map(mapPonto)
}

export async function getPontoByDate(userId: string, data: string) {
  const pontos = await listPontos(userId)
  return pontos.find((p) => p.data === data)
}

export async function createPonto(
  input: unknown,
  userId?: string,
): Promise<PontoRegistro> {
  const session = await requireAuth()
  const parsed = pontoInputSchema.parse(input)
  const uid = userId ?? session.id

  const supabase = await createClient()
  const row = pontoToInsert({
    userId: uid,
    data: parsed.data,
    entrada1: parsed.entrada1 ?? null,
    saida1: parsed.saida1 ?? null,
    entrada2: parsed.entrada2 ?? null,
    saida2: parsed.saida2 ?? null,
    totalMinutos: parsed.totalMinutos,
    observacao: parsed.observacao ?? null,
    justificativaHoraExtra: parsed.justificativaHoraExtra ?? null,
  })

  const { data, error } = await supabase
    .from('ponto_registros')
    .insert(row)
    .select()
    .single()

  if (error) throw error
  return mapPonto(data as PontoRegistroRow)
}

export async function updatePonto(
  id: string,
  input: Partial<ReturnType<typeof pontoInputSchema.parse>>,
): Promise<PontoRegistro> {
  await requireAuth()
  const supabase = await createClient()

  const update: Record<string, unknown> = {}
  if (input.entrada1 !== undefined) update.entrada1 = input.entrada1
  if (input.saida1 !== undefined) update.saida1 = input.saida1
  if (input.entrada2 !== undefined) update.entrada2 = input.entrada2
  if (input.saida2 !== undefined) update.saida2 = input.saida2
  if (input.totalMinutos !== undefined) update.total_minutos = input.totalMinutos
  if (input.observacao !== undefined) update.observacao = input.observacao
  if (input.justificativaHoraExtra !== undefined)
    update.justificativa_hora_extra = input.justificativaHoraExtra

  const { data, error } = await supabase
    .from('ponto_registros')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapPonto(data as PontoRegistroRow)
}
