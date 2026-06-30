import type { UserRole } from '@/lib/types'
import { getDashboardPathForRole } from '@/lib/auth-routes'

/**
 * Navegação pós-login com request completo ao servidor.
 * Evita loop middleware (sem cookie) vs client (com sessão em memória).
 */
export function navigateAfterLogin(cargo: UserRole, mustChangePassword?: boolean): void {
  if (mustChangePassword) {
    window.location.assign('/dashboard/alterar-senha')
    return
  }
  const path = getDashboardPathForRole(cargo)
  window.location.assign(path)
}
