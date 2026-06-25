import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import {
  mapPonto,
  mapJustificativa,
  mapBloqueio,
  mapProfile,
  mapDesafioProgresso,
} from '@/lib/server/mappers'
import { getSessionUser } from '@/lib/server/auth'
import { assertTargetUserAccess } from '@/lib/server/access-control'
import { calcularBancoHoras, calcularBancoHorasPorPeriodo } from '@/lib/banco-horas'
import { listNotificacoesForUser } from '@/lib/server/services/notificacao.service'
import {
  PROFILE_COLUMNS,
  PONTO_COLUMNS,
  JUSTIFICATIVA_COLUMNS,
  BLOQUEIO_COLUMNS,
  DESAFIO_PROGRESSO_COLUMNS,
} from '@/lib/server/query-columns'
import {
  ADMIN_BOOTSTRAP_ROW_LIMIT,
  dashboardWindowStartIso,
} from '@/lib/server/dashboard-window'
import { getCachedDesafiosSemanais, getCachedPontoConfigs } from '@/lib/server/cached-static-data'
import { mapDesafio } from '@/lib/server/mappers'
import type { User, Notificacao, PontoConfig } from '@/lib/types'
import type {
  PontoRegistroRow,
  JustificativaRow,
  BloqueioPresencaRow,
  ProfileRow,
} from '@/lib/server/db-types'

export type DashboardBootstrap = {
  usuarios: User[]
  notificacoes: Notificacao[]
  desafios: ReturnType<typeof mapDesafio>[]
  desafioProgressos: ReturnType<typeof mapDesafioProgresso>[]
  pontoConfigs: PontoConfig[]
  bloqueiosPresenca: ReturnType<typeof mapBloqueio>[]
}

export type DashboardSnapshot = DashboardBootstrap & {
  pontos: ReturnType<typeof mapPonto>[]
  justificativas: ReturnType<typeof mapJustificativa>[]
}

async function loadUsuariosForSession(
  session: User,
  supabase: SupabaseClient,
): Promise<User[]> {
  if (session.cargo === 'estagiario') {
    return [session]
  }

  if (session.cargo === 'gestor') {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .or(`id.eq.${session.id},gestor_id.eq.${session.id}`)
    if (error) throw error
    return (data as ProfileRow[]).map(mapProfile)
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('nome')
  if (error) throw error
  return (data as ProfileRow[]).map(mapProfile)
}

async function loadBloqueiosScoped(
  session: User,
  userIds: string[],
  supabase: SupabaseClient,
) {
  let query = supabase.from('bloqueios_presenca').select(BLOQUEIO_COLUMNS)

  if (session.cargo === 'estagiario') {
    query = query.eq('user_id', session.id)
  } else if (session.cargo === 'gestor' && userIds.length > 0) {
    query = query.in('user_id', userIds)
  } else if (session.cargo === 'admin') {
    query = query.limit(ADMIN_BOOTSTRAP_ROW_LIMIT)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as BloqueioPresencaRow[]).map(mapBloqueio)
}

async function loadProgressosScoped(
  session: User,
  userIds: string[],
  supabase: SupabaseClient,
) {
  let query = supabase.from('desafio_progressos').select(DESAFIO_PROGRESSO_COLUMNS)

  if (session.cargo === 'estagiario') {
    query = query.eq('user_id', session.id)
  } else if (session.cargo === 'gestor' && userIds.length > 0) {
    query = query.in('user_id', userIds)
  } else if (session.cargo === 'admin') {
    query = query.limit(ADMIN_BOOTSTRAP_ROW_LIMIT)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapDesafioProgresso)
}

export async function loadDashboardBootstrap(
  existingSupabase?: SupabaseClient,
): Promise<DashboardBootstrap> {
  const { pontos: _p, justificativas: _j, ...bootstrap } = await loadDashboardSnapshot(
    existingSupabase,
  )
  return bootstrap
}

export async function loadDashboardSnapshot(
  existingSupabase?: SupabaseClient,
): Promise<DashboardSnapshot> {
  const supabase = existingSupabase ?? (await createClient())
  const session = await getSessionUser()
  if (!session) throw new Error('Não autenticado')

  const usuarios = await loadUsuariosForSession(session, supabase)
  const userIds = usuarios.map((u) => u.id)
  const gestorTeamIds =
    session.cargo === 'gestor'
      ? usuarios.filter((u) => u.cargo === 'estagiario').map((u) => u.id)
      : undefined

  const [bloqueiosPresenca, desafios, desafioProgressos, pontoConfigs, notificacoes, pontos, justificativas] =
    await Promise.all([
      loadBloqueiosScoped(session, userIds, supabase),
      getCachedDesafiosSemanais(supabase),
      loadProgressosScoped(session, userIds, supabase),
      getCachedPontoConfigs(supabase),
      listNotificacoesForUser(session.id, supabase),
      listPontosScoped({}, supabase, session, gestorTeamIds),
      listJustificativasScoped({ signFiles: false }, supabase, session, gestorTeamIds),
    ])

  return {
    usuarios,
    notificacoes,
    desafios,
    desafioProgressos,
    pontoConfigs,
    bloqueiosPresenca,
    pontos,
    justificativas,
  }
}

export type PontosQueryParams = {
  userId?: string
  from?: string
  to?: string
  limit?: number
}

export async function listPontosScoped(
  params: PontosQueryParams = {},
  existingSupabase?: SupabaseClient,
  existingSession?: User,
  gestorTeamIds?: string[],
): Promise<ReturnType<typeof mapPonto>[]> {
  const session = existingSession ?? (await getSessionUser())
  if (!session) throw new Error('Não autenticado')

  const supabase = existingSupabase ?? (await createClient())
  const from = params.from ?? dashboardWindowStartIso()
  const limit = params.limit ?? ADMIN_BOOTSTRAP_ROW_LIMIT

  let query = supabase
    .from('ponto_registros')
    .select(PONTO_COLUMNS)
    .gte('data', from)
    .order('data', { ascending: false })
    .limit(limit)

  if (params.to) query = query.lte('data', params.to)

  const targetUserId = params.userId ?? (session.cargo === 'estagiario' ? session.id : undefined)
  if (targetUserId) {
    await assertTargetUserAccess(session, targetUserId, supabase)
    query = query.eq('user_id', targetUserId)
  } else if (session.cargo === 'estagiario') {
    query = query.eq('user_id', session.id)
  } else if (session.cargo === 'gestor') {
    const ids =
      gestorTeamIds ??
      (
        await supabase.from('profiles').select('id').eq('gestor_id', session.id)
      ).data?.map((t: { id: string }) => t.id) ??
      []
    if (ids.length === 0) return []
    query = query.in('user_id', ids)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as PontoRegistroRow[]).map(mapPonto)
}

export type JustificativasQueryParams = {
  userId?: string
  rhVisible?: boolean
  signFiles?: boolean
  limit?: number
}

export async function listJustificativasScoped(
  params: JustificativasQueryParams = {},
  existingSupabase?: SupabaseClient,
  existingSession?: User,
  gestorTeamIds?: string[],
): Promise<ReturnType<typeof mapJustificativa>[]> {
  const session = existingSession ?? (await getSessionUser())
  if (!session) throw new Error('Não autenticado')

  const supabase = existingSupabase ?? (await createClient())
  const limit = params.limit ?? ADMIN_BOOTSTRAP_ROW_LIMIT
  const windowStart = dashboardWindowStartIso()

  let query = supabase
    .from('justificativas')
    .select(JUSTIFICATIVA_COLUMNS)
    .gte('data', windowStart)
    .order('data', { ascending: false })
    .limit(limit)

  if (params.rhVisible) {
    if (session.cargo !== 'admin') throw new Error('Sem permissão')
    query = query.or(
      'tipo.eq.atestado,and(tipo.eq.compensacao,status_compensacao.eq.aprovada_gestor)',
    )
  }

  const targetUserId = params.userId ?? (session.cargo === 'estagiario' ? session.id : undefined)
  if (targetUserId) {
    await assertTargetUserAccess(session, targetUserId, supabase)
    query = query.eq('user_id', targetUserId)
  } else if (session.cargo === 'estagiario') {
    query = query.eq('user_id', session.id)
  } else if (session.cargo === 'gestor') {
    const ids =
      gestorTeamIds ??
      (
        await supabase.from('profiles').select('id').eq('gestor_id', session.id)
      ).data?.map((t: { id: string }) => t.id) ??
      []
    if (ids.length === 0) return []
    query = query.in('user_id', ids)
  }

  const { data, error } = await query
  if (error) throw error
  const rows = data as JustificativaRow[]

  if (!params.signFiles) {
    return rows.map((r) => mapJustificativa(r, null))
  }

  const { signedUrlsForPaths } = await import('@/lib/server/storage-signed-urls')
  const urlMap = await signedUrlsForPaths(
    supabase,
    rows.map((r) => r.arquivo_path),
  )
  return rows.map((r) =>
    mapJustificativa(r, r.arquivo_path ? urlMap.get(r.arquivo_path) ?? null : null),
  )
}

export async function getBancoHorasForUser(
  userId: string,
  year?: string,
  month?: string,
): Promise<number> {
  const supabase = await createClient()
  const session = await getSessionUser()
  if (!session) throw new Error('Não autenticado')

  const { data: profileRow } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single()

  if (!profileRow) throw new Error('Sem permissão')

  const profile = profileRow as ProfileRow
  await assertTargetUserAccess(session, userId, supabase)
  const user = mapProfile(profile)

  const windowStart = dashboardWindowStartIso()
  const pontos = await listPontosScoped({ userId, from: windowStart }, supabase)
  const justificativas = await listJustificativasScoped({ userId, signFiles: false }, supabase)

  const { data: bloqueiosData } = await supabase
    .from('bloqueios_presenca')
    .select(BLOQUEIO_COLUMNS)
    .eq('user_id', userId)

  const bloqueios = (bloqueiosData as BloqueioPresencaRow[] ?? []).map(mapBloqueio)

  if (year && month) {
    return calcularBancoHorasPorPeriodo(user, pontos, justificativas, bloqueios, year, month)
  }
  return calcularBancoHoras(user, pontos, justificativas, bloqueios)
}
