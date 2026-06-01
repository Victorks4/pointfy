/** Janela padrão de dados no bootstrap do dashboard (dias). */
export const DASHBOARD_WINDOW_DAYS = 180

export const ADMIN_BOOTSTRAP_ROW_LIMIT = 500

export function dashboardWindowStartIso(): string {
  const d = new Date()
  d.setDate(d.getDate() - DASHBOARD_WINDOW_DAYS)
  return d.toISOString().slice(0, 10)
}
