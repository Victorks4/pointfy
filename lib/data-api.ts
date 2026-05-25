import type { DashboardSnapshot } from '@/lib/server/services/dashboard.service'

export async function fetchDashboardData(): Promise<DashboardSnapshot> {
  const res = await fetch('/api/v1/data', { credentials: 'include' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Falha ao carregar dados')
  }
  return res.json()
}
