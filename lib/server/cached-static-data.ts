import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { mapDesafio, mapPontoConfig } from '@/lib/server/mappers'
import { DESAFIO_COLUMNS, PONTO_CONFIG_COLUMNS } from '@/lib/server/query-columns'
import type { DesafioSemanalRow, PontoConfigRow } from '@/lib/server/db-types'

async function fetchDesafiosSemanais() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('desafios_semanais').select(DESAFIO_COLUMNS)
  if (error) throw error
  return (data as DesafioSemanalRow[]).map(mapDesafio)
}

async function fetchPontoConfigs() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('ponto_configs').select(PONTO_CONFIG_COLUMNS)
  if (error) throw error
  return (data as PontoConfigRow[]).map(mapPontoConfig)
}

/** Dados semi-estáticos — TTL 5 min (invalidar via tag ao mutar no admin). */
export const cachedDesafios = unstable_cache(fetchDesafiosSemanais, ['pontify-desafios-semanais'], {
  revalidate: 300,
  tags: ['desafios-semanais'],
})

export const cachedPontoConfigs = unstable_cache(fetchPontoConfigs, ['pontify-ponto-configs'], {
  revalidate: 300,
  tags: ['ponto-configs'],
})

export async function getCachedDesafiosSemanais() {
  return cachedDesafios()
}

export async function getCachedPontoConfigs() {
  return cachedPontoConfigs()
}
