import type { UserRole } from '@/lib/types'

export function getDashboardPathForRole(cargo: UserRole): string {
  if (cargo === 'admin') return '/dashboard/admin'
  if (cargo === 'gestor') return '/dashboard/gestor'
  return '/dashboard'
}
