import { createClient } from '@/lib/supabase/server'
import { mapPonto, mapJustificativa, mapBloqueio, mapProfile } from '@/lib/server/mappers'
import { requireAuth } from '@/lib/server/auth'
import { calcularBancoHoras, calcularBancoHorasPorPeriodo } from '@/lib/server/banco-horas'
import type {
  PontoRegistro,
  Justificativa,
  BloqueioPresenca,
  User,
} from '@/lib/types'
import type {
  PontoRegistroRow,
  JustificativaRow,
  BloqueioPresencaRow,
  ProfileRow,
} from '@/lib/server/db-types'

export type DashboardSnapshot = {
  pontos: PontoRegistro[]
  justificativas: Justificativa[]
  bloqueiosPresenca: BloqueioPresenca[]
  usuarios: User[]
  notificacoes: import('@/lib/types').Notificacao[]
  desafios: import('@/lib/types').DesafioSemanal[]
  desafioProgressos: import('@/lib/types').DesafioProgresso[]
  pontoConfigs: import('@/lib/types').PontoConfig[]
}

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  const session = await requireAuth()
  const supabase = await createClient()

  const [
    pontosRes,
    justificativasRes,
    bloqueiosRes,
    usuariosRes,
    desafiosRes,
    progressosRes,
    configsRes,
  ] = await Promise.all([
    supabase.from('ponto_registros').select('*').order('data', { ascending: false }),
    supabase.from('justificativas').select('*').order('data', { ascending: false }),
    supabase.from('bloqueios_presenca').select('*'),
    supabase.from('profiles').select('*'),
    supabase.from('desafios_semanais').select('*'),
    supabase.from('desafio_progressos').select('*'),
    supabase.from('ponto_configs').select('*'),
  ])

  const pontos = (pontosRes.data as PontoRegistroRow[] ?? []).map(mapPonto)
  const justificativas = (justificativasRes.data as JustificativaRow[] ?? []).map((r) =>
    mapJustificativa(r, r.arquivo_path),
  )
  const bloqueiosPresenca = (bloqueiosRes.data as BloqueioPresencaRow[] ?? []).map(mapBloqueio)
  const usuarios = (usuariosRes.data as ProfileRow[] ?? []).map(mapProfile)

  const { listNotificacoesForUser } = await import('./notificacao.service')
  const notificacoes = await listNotificacoesForUser(session.id)

  const { mapDesafio, mapDesafioProgresso, mapPontoConfig } = await import('@/lib/server/mappers')
  const desafios = (desafiosRes.data ?? []).map(mapDesafio)
  const desafioProgressos = (progressosRes.data ?? []).map(mapDesafioProgresso)
  const pontoConfigs = (configsRes.data ?? []).map(mapPontoConfig)

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
