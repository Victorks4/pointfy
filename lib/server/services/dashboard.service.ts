import { createClient } from '@/lib/supabase/server'
import {
  mapPonto,
  mapJustificativa,
  mapBloqueio,
  mapProfile,
  mapDesafio,
  mapDesafioProgresso,
  mapPontoConfig,
} from '@/lib/server/mappers'
import { requireAuth } from '@/lib/server/auth'
import { calcularBancoHoras, calcularBancoHorasPorPeriodo } from '@/lib/server/banco-horas'
import { listNotificacoesForUser } from '@/lib/server/services/notificacao.service'
import type { User } from '@/lib/types'
import type {
  PontoRegistroRow,
  JustificativaRow,
  BloqueioPresencaRow,
  ProfileRow,
  DesafioSemanalRow,
  DesafioProgressoRow,
  PontoConfigRow,
} from '@/lib/server/db-types'

export type DashboardSnapshot = {
  pontos: ReturnType<typeof mapPonto>[]
  justificativas: ReturnType<typeof mapJustificativa>[]
  bloqueiosPresenca: ReturnType<typeof mapBloqueio>[]
  usuarios: User[]
  notificacoes: import('@/lib/types').Notificacao[]
  desafios: ReturnType<typeof mapDesafio>[]
  desafioProgressos: ReturnType<typeof mapDesafioProgresso>[]
  pontoConfigs: ReturnType<typeof mapPontoConfig>[]
}

async function loadUsuariosForSession(session: User, supabase: Awaited<ReturnType<typeof createClient>>) {
  if (session.cargo === 'estagiario') {
    return [session]
  }

  if (session.cargo === 'gestor') {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`id.eq.${session.id},gestor_id.eq.${session.id}`)
    if (error) throw error
    return (data as ProfileRow[]).map(mapProfile)
  }

  const { data, error } = await supabase.from('profiles').select('*').order('nome')
  if (error) throw error
  return (data as ProfileRow[]).map(mapProfile)
}

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  const session = await requireAuth()
  const supabase = await createClient()

  const usuarios = await loadUsuariosForSession(session, supabase)
  const userIds = usuarios.map((u) => u.id)

  const pontosQuery = supabase.from('ponto_registros').select('*').order('data', { ascending: false })
  const justificativasQuery = supabase
    .from('justificativas')
    .select('*')
    .order('data', { ascending: false })

  if (session.cargo === 'gestor' && userIds.length > 0) {
    pontosQuery.in('user_id', userIds)
    justificativasQuery.in('user_id', userIds)
  }

  const [pontosRes, justificativasRes, bloqueiosRes, desafiosRes, progressosRes, configsRes, notificacoes] =
    await Promise.all([
      pontosQuery,
      justificativasQuery,
      supabase.from('bloqueios_presenca').select('*'),
      supabase.from('desafios_semanais').select('*'),
      supabase.from('desafio_progressos').select('*'),
      supabase.from('ponto_configs').select('*'),
      listNotificacoesForUser(session.id),
    ])

  if (pontosRes.error) throw pontosRes.error
  if (justificativasRes.error) throw justificativasRes.error
  if (bloqueiosRes.error) throw bloqueiosRes.error
  if (desafiosRes.error) throw desafiosRes.error
  if (progressosRes.error) throw progressosRes.error
  if (configsRes.error) throw configsRes.error

  const pontos = (pontosRes.data as PontoRegistroRow[] ?? []).map(mapPonto)
  const justificativas = (justificativasRes.data as JustificativaRow[] ?? []).map((r) =>
    mapJustificativa(r, r.arquivo_path),
  )
  const bloqueiosPresenca = (bloqueiosRes.data as BloqueioPresencaRow[] ?? []).map(mapBloqueio)
  const desafios = (desafiosRes.data ?? []).map(mapDesafio)
  const desafioProgressos = (progressosRes.data ?? []).map(mapDesafioProgresso)
  const pontoConfigs = (configsRes.data as PontoConfigRow[] ?? []).map(mapPontoConfig)

  return {
    pontos,
    justificativas,
    bloqueiosPresenca,
    usuarios,
    notificacoes,
    desafios,
    desafioProgressos,
    pontoConfigs,
  }
}

export async function getBancoHorasForUser(
  userId: string,
  year?: string,
  month?: string,
): Promise<number> {
  const snapshot = await loadDashboardSnapshot()
  const user = snapshot.usuarios.find((u) => u.id === userId)
  if (!user) return 0

  if (year && month) {
    return calcularBancoHorasPorPeriodo(
      user,
      snapshot.pontos,
      snapshot.justificativas,
      snapshot.bloqueiosPresenca,
      year,
      month,
    )
  }
  return calcularBancoHoras(
    user,
    snapshot.pontos,
    snapshot.justificativas,
    snapshot.bloqueiosPresenca,
  )
}
