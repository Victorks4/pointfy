import { createClient } from '@/lib/supabase/server'
import { mapFeriado } from '@/lib/server/mappers'
import { requireRole } from '@/lib/server/auth'
import { parseInput } from '@/lib/validations/parse'
import { feriadoInputSchema } from '@/lib/validations/schemas'
import { FERIADO_COLUMNS } from '@/lib/server/query-columns'
import type { Feriado } from '@/lib/types'
import type { FeriadoRow } from '@/lib/server/db-types'

export async function listFeriados(): Promise<Feriado[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feriados')
    .select(FERIADO_COLUMNS)
    .order('data', { ascending: true })
  if (error) throw error
  return (data as FeriadoRow[]).map(mapFeriado)
}

export async function createFeriado(input: unknown): Promise<Feriado> {
  await requireRole('admin')
  const parsed = parseInput(feriadoInputSchema, input)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feriados')
    .insert({
      data: parsed.data,
      nome: parsed.nome,
      tipo: parsed.tipo,
      recorrente: parsed.recorrente ?? false,
    })
    .select(FERIADO_COLUMNS)
    .single()
  if (error) throw error
  return mapFeriado(data as FeriadoRow)
}

export async function deleteFeriado(id: string): Promise<void> {
  await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase.from('feriados').delete().eq('id', id)
  if (error) throw error
}

export async function isFeriado(date: string, feriados?: Feriado[]): Promise<boolean> {
  const list = feriados ?? (await listFeriados())
  return list.some((f) => f.data === date)
}
