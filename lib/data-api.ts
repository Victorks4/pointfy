import type {
  DashboardBootstrap,
  DashboardSnapshot,
} from '@/lib/server/services/dashboard.service'
import type { PontoRegistro, Justificativa } from '@/lib/types'

const fetchOpts: RequestInit = { credentials: 'include', cache: 'no-store' }

let inflightBootstrap: Promise<DashboardBootstrap> | null = null
let inflightPontos: Promise<PontoRegistro[]> | null = null
let inflightJustificativas: Promise<Justificativa[]> | null = null

async function parseError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}))
  throw new Error((body as { error?: string }).error ?? 'Falha ao carregar dados')
}

export async function fetchDashboardBootstrap(): Promise<DashboardBootstrap> {
  if (inflightBootstrap) return inflightBootstrap
  inflightBootstrap = (async () => {
    const res = await fetch('/api/v1/data', fetchOpts)
    if (!res.ok) await parseError(res)
    return res.json()
  })().finally(() => {
    inflightBootstrap = null
  })
  return inflightBootstrap
}

export async function fetchPontos(params?: {
  userId?: string
  from?: string
  to?: string
}): Promise<PontoRegistro[]> {
  if (!inflightPontos) {
    const qs = new URLSearchParams()
    if (params?.userId) qs.set('userId', params.userId)
    if (params?.from) qs.set('from', params.from)
    if (params?.to) qs.set('to', params.to)
    const suffix = qs.toString() ? `?${qs}` : ''
    inflightPontos = (async () => {
      const res = await fetch(`/api/v1/pontos${suffix}`, fetchOpts)
      if (!res.ok) await parseError(res)
      const body = (await res.json()) as { pontos: PontoRegistro[] }
      return body.pontos
    })().finally(() => {
      inflightPontos = null
    })
  }
  return inflightPontos
}

export async function fetchJustificativas(params?: {
  userId?: string
  rh?: boolean
  sign?: boolean
}): Promise<Justificativa[]> {
  if (!inflightJustificativas) {
    const qs = new URLSearchParams()
    if (params?.userId) qs.set('userId', params.userId)
    if (params?.rh) qs.set('rh', '1')
    if (params?.sign) qs.set('sign', '1')
    const suffix = qs.toString() ? `?${qs}` : ''
    inflightJustificativas = (async () => {
      const res = await fetch(`/api/v1/justificativas${suffix}`, fetchOpts)
      if (!res.ok) await parseError(res)
      const body = (await res.json()) as { justificativas: Justificativa[] }
      return body.justificativas
    })().finally(() => {
      inflightJustificativas = null
    })
  }
  return inflightJustificativas
}

/** Snapshot completo (bootstrap + domínios pesados em paralelo). */
export async function fetchDashboardData(): Promise<DashboardSnapshot> {
  const [bootstrap, pontos, justificativas] = await Promise.all([
    fetchDashboardBootstrap(),
    fetchPontos(),
    fetchJustificativas(),
  ])
  return { ...bootstrap, pontos, justificativas }
}

export function prefetchDashboardData(): void {
  void fetchDashboardBootstrap().catch(() => {})
  void fetchPontos().catch(() => {})
  void fetchJustificativas().catch(() => {})
}

export function clearDashboardDataPrefetch(): void {
  inflightBootstrap = null
  inflightPontos = null
  inflightJustificativas = null
}
