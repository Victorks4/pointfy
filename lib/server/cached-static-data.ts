import type { SupabaseClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { mapDesafio, mapPontoConfig } from '@/lib/server/mappers'
import { DESAFIO_COLUMNS, PONTO_CONFIG_COLUMNS } from '@/lib/server/query-columns'
import type { DesafioSemanalRow, PontoConfigRow } from '@/lib/server/db-types'

export async function fetchDesafiosSemanais(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('desafios_semanais').select(DESAFIO_COLUMNS)
  if (error) throw error
  return (data as DesafioSemanalRow[]).map(mapDesafio)
}

export async function fetchPontoConfigs(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('ponto_configs').select(PONTO_CONFIG_COLUMNS)
  if (error) throw error
  return (data as PontoConfigRow[]).map(mapPontoConfig)
}

const cachedDesafiosGlobal = unstable_cache(
  async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    return fetchDesafiosSemanais(supabase)
  },
  ['pontify-desafios-semanais'],
  { revalidate: 300, tags: ['desafios-semanais'] },
)

const cachedPontoConfigsGlobal = unstable_cache(
  async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    return fetchPontoConfigs(supabase)
  },
  ['pontify-ponto-configs'],
  { revalidate: 300, tags: ['ponto-configs'] },
)

/** Cache primário — invalidar via revalidateTag no admin. */
export async function getCachedDesafiosSemanais(_supabase?: SupabaseClient) {
  return cachedDesafiosGlobal()
}

export async function getCachedPontoConfigs(_supabase?: SupabaseClient) {
  return cachedPontoConfigsGlobal()
}
