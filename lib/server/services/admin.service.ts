import { createClient } from '@/lib/supabase/server'
import {
  mapBloqueio,
  mapDesafio,
  mapDesafioProgresso,
  mapPontoConfig,
} from '@/lib/server/mappers'
import { requireRole } from '@/lib/server/auth'
import { getLimiteMinutosSemJustificativa } from '@/lib/ponto-config-utils'
import { parseInput } from '@/lib/validations/parse'
import {
  bloqueioInputSchema,
  desafioInputSchema,
  desafioProgressoSchema,
  pontoConfigInputSchema,
} from '@/lib/validations/schemas'
import type {
  BloqueioPresenca,
  DesafioSemanal,
  DesafioProgresso,
  PontoConfig,
} from '@/lib/types'
import type {
  BloqueioPresencaRow,
  DesafioSemanalRow,
  DesafioProgressoRow,
  PontoConfigRow,
} from '@/lib/server/db-types'

export async function listBloqueios(): Promise<BloqueioPresenca[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('bloqueios_presenca').select('*')
  if (error) throw error
  return (data as BloqueioPresencaRow[]).map(mapBloqueio)
}

export async function addBloqueio(input: unknown): Promise<BloqueioPresenca> {
  await requireRole('admin')
  const parsed = parseInput(bloqueioInputSchema, input)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bloqueios_presenca')
    .insert({
      user_id: parsed.userId,
      data_inicio: parsed.dataInicio,
      data_fim: parsed.dataFim ?? null,
      motivo: parsed.motivo ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return mapBloqueio(data as BloqueioPresencaRow)
}

export async function removeBloqueio(id: string) {
  await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase.from('bloqueios_presenca').delete().eq('id', id)
  if (error) throw error
}

export async function listDesafios(): Promise<DesafioSemanal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('desafios_semanais').select('*')
  if (error) throw error
  return (data as DesafioSemanalRow[]).map(mapDesafio)
}

export async function getDesafiosSemanaAtual(): Promise<DesafioSemanal[]> {
  const all = await listDesafios()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return all.filter((d) => {
    if (!d.ativo) return false
    const inicio = new Date(`${d.dataInicio}T00:00:00`)
    const fim = new Date(`${d.dataFim}T23:59:59`)
    return today >= inicio && today <= fim
  })
}

export async function addDesafio(input: unknown): Promise<DesafioSemanal> {
  await requireRole('admin')
  const parsed = parseInput(desafioInputSchema, input)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('desafios_semanais')
    .insert({
      titulo: parsed.titulo,
      descricao: parsed.descricao,
      tipo: parsed.tipo,
      meta: parsed.meta,
      recompensa: parsed.recompensa,
      data_inicio: parsed.dataInicio,
      data_fim: parsed.dataFim,
      ativo: parsed.ativo,
    })
    .select()
    .single()
  if (error) throw error
  return mapDesafio(data as DesafioSemanalRow)
}

export async function updateDesafio(id: string, input: unknown): Promise<DesafioSemanal> {
  await requireRole('admin')
  const parsed = parseInput(desafioInputSchema.partial(), input)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('desafios_semanais')
    .update({
      ...(parsed.titulo && { titulo: parsed.titulo }),
      ...(parsed.descricao !== undefined && { descricao: parsed.descricao }),
      ...(parsed.tipo && { tipo: parsed.tipo }),
      ...(parsed.meta !== undefined && { meta: parsed.meta }),
      ...(parsed.recompensa && { recompensa: parsed.recompensa }),
      ...(parsed.dataInicio && { data_inicio: parsed.dataInicio }),
      ...(parsed.dataFim && { data_fim: parsed.dataFim }),
      ...(parsed.ativo !== undefined && { ativo: parsed.ativo }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapDesafio(data as DesafioSemanalRow)
}

export async function deleteDesafio(id: string) {
  await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase.from('desafios_semanais').delete().eq('id', id)
  if (error) throw error
}

export async function listDesafioProgressos(): Promise<DesafioProgresso[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('desafio_progressos').select('*')
  if (error) throw error
  return (data as DesafioProgressoRow[]).map(mapDesafioProgresso)
}

export async function upsertDesafioProgresso(
  userId: string,
  desafioId: string,
  progressoAtual: number,
  concluido: boolean,
): Promise<DesafioProgresso> {
  parseInput(desafioProgressoSchema, { userId, desafioId, progressoAtual, concluido })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('desafio_progressos')
    .upsert(
      {
        user_id: userId,
        desafio_id: desafioId,
        progresso_atual: progressoAtual,
        concluido,
        concluido_em: concluido ? new Date().toISOString() : null,
      },
      { onConflict: 'desafio_id,user_id' },
    )
    .select()
    .single()
  if (error) throw error
  return mapDesafioProgresso(data as DesafioProgressoRow)
}

export async function listPontoConfigs(): Promise<PontoConfig[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('ponto_configs').select('*')
  if (error) throw error
  return (data as PontoConfigRow[]).map(mapPontoConfig)
}

export async function getActivePontoConfig(): Promise<PontoConfig> {
  const configs = await listPontoConfigs()
  return configs.find((c) => c.ativo) ?? configs.find((c) => c.padrao) ?? configs[0]
}

export async function addPontoConfig(input: unknown): Promise<PontoConfig> {
  await requireRole('admin')
  const parsed = parseInput(pontoConfigInputSchema, input)
  const supabase = await createClient()

  if (parsed.ativo) {
    await supabase.from('ponto_configs').update({ ativo: false }).neq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { data, error } = await supabase
    .from('ponto_configs')
    .insert({
      nome: parsed.nome,
      meta_diaria_minutos: parsed.metaDiariaMinutos,
      limite_minutos_sem_justificativa: getLimiteMinutosSemJustificativa({
        metaDiariaMinutos: parsed.metaDiariaMinutos,
      }),
      rejeitar_minutos_zero: parsed.rejeitarMinutosZero,
      formato_decimal: parsed.formatoDecimal,
      horario_entrada_esperado: parsed.horarioEntradaEsperado,
      ativo: parsed.ativo,
      padrao: parsed.padrao ?? false,
    })
    .select()
    .single()
  if (error) throw error
  return mapPontoConfig(data as PontoConfigRow)
}

export async function updatePontoConfig(id: string, input: unknown): Promise<PontoConfig> {
  await requireRole('admin')
  const parsed = parseInput(pontoConfigInputSchema.partial(), input)
  const supabase = await createClient()

  if (parsed.ativo) {
    await supabase.from('ponto_configs').update({ ativo: false }).neq('id', id)
  }

  const { data, error } = await supabase
    .from('ponto_configs')
    .update({
      ...(parsed.nome && { nome: parsed.nome }),
      ...(parsed.metaDiariaMinutos && {
        meta_diaria_minutos: parsed.metaDiariaMinutos,
        limite_minutos_sem_justificativa: getLimiteMinutosSemJustificativa({
          metaDiariaMinutos: parsed.metaDiariaMinutos,
        }),
      }),
      ...(parsed.rejeitarMinutosZero !== undefined && {
        rejeitar_minutos_zero: parsed.rejeitarMinutosZero,
      }),
      ...(parsed.formatoDecimal && { formato_decimal: parsed.formatoDecimal }),
      ...(parsed.horarioEntradaEsperado && {
        horario_entrada_esperado: parsed.horarioEntradaEsperado,
      }),
      ...(parsed.ativo !== undefined && { ativo: parsed.ativo }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapPontoConfig(data as PontoConfigRow)
}

export async function deletePontoConfig(id: string) {
  await requireRole('admin')
  const supabase = await createClient()
  const configs = await listPontoConfigs()
  const target = configs.find((c) => c.id === id)
  if (target?.padrao) throw new Error('Não é possível excluir config padrão')

  const { error } = await supabase.from('ponto_configs').delete().eq('id', id)
  if (error) throw error

  if (target?.ativo) {
    const fallback = configs.find((c) => c.padrao && c.id !== id)
    if (fallback) {
      await supabase.from('ponto_configs').update({ ativo: true }).eq('id', fallback.id)
    }
  }
}
