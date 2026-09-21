import type { DashboardSnapshot } from '@/lib/server/services/dashboard.service'
import type { PontoRegistro, Justificativa } from '@/lib/types'

const fetchOpts: RequestInit = { credentials: 'include', cache: 'no-store' }

let inflightSnapshot: Promise<DashboardSnapshot> | null = null
const inflightPontos = new Map<string, Promise<PontoRegistro[]>>()
const inflightJustificativas = new Map<string, Promise<Justificativa[]>>()

export function pontosInflightKey(params?: { userId?: string; from?: string; to?: string }) {
  const qs = new URLSearchParams()
  if (params?.userId) qs.set('userId', params.userId)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  return qs.toString() || '__default__'
}

export function justificativasInflightKey(params?: { userId?: string; rh?: boolean; sign?: boolean }) {
  const qs = new URLSearchParams()
  if (params?.userId) qs.set('userId', params.userId)
  if (params?.rh) qs.set('rh', '1')
  if (params?.sign) qs.set('sign', '1')
  return qs.toString() || '__default__'
}

async function parseError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}))
  throw new Error((body as { error?: string }).error ?? 'Falha ao carregar dados')
}

/** Snapshot completo em um único request. */
export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (inflightSnapshot) return inflightSnapshot
  inflightSnapshot = (async () => {
    const res = await fetch('/api/v1/data', fetchOpts)
    if (!res.ok) await parseError(res)
    return res.json()
  })().finally(() => {
    inflightSnapshot = null
  })
  return inflightSnapshot
}

/** @deprecated Use fetchDashboardSnapshot */
export async function fetchDashboardBootstrap() {
  const snapshot = await fetchDashboardSnapshot()
  const { pontos: _p, justificativas: _j, ...bootstrap } = snapshot
  return bootstrap
}

export async function fetchPontos(params?: {
  userId?: string
  from?: string
  to?: string
}): Promise<PontoRegistro[]> {
  const key = pontosInflightKey(params)
  const existing = inflightPontos.get(key)
  if (existing) return existing

  const qs = new URLSearchParams()
  if (params?.userId) qs.set('userId', params.userId)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  const suffix = qs.toString() ? `?${qs}` : ''

  const promise = (async () => {
    const res = await fetch(`/api/v1/pontos${suffix}`, fetchOpts)
    if (!res.ok) await parseError(res)
    const body = (await res.json()) as { pontos: PontoRegistro[] }
    return body.pontos
  })().finally(() => {
    inflightPontos.delete(key)
  })

  inflightPontos.set(key, promise)
  return promise
}

export async function fetchJustificativas(params?: {
  userId?: string
  rh?: boolean
  sign?: boolean
}): Promise<Justificativa[]> {
  const key = justificativasInflightKey(params)
  const existing = inflightJustificativas.get(key)
  if (existing) return existing

  const qs = new URLSearchParams()
  if (params?.userId) qs.set('userId', params.userId)
  if (params?.rh) qs.set('rh', '1')
  if (params?.sign) qs.set('sign', '1')
  const suffix = qs.toString() ? `?${qs}` : ''

  const promise = (async () => {
    const res = await fetch(`/api/v1/justificativas${suffix}`, fetchOpts)
    if (!res.ok) await parseError(res)
    const body = (await res.json()) as { justificativas: Justificativa[] }
    return body.justificativas
  })().finally(() => {
    inflightJustificativas.delete(key)
  })

  inflightJustificativas.set(key, promise)
  return promise
}

export async function fetchDashboardData(): Promise<DashboardSnapshot> {
  return fetchDashboardSnapshot()
}

export function prefetchDashboardData(): void {
  void fetchDashboardSnapshot().catch(() => {})
}

export function clearDashboardDataPrefetch(): void {
  inflightSnapshot = null
  inflightPontos.clear()
  inflightJustificativas.clear()
}
