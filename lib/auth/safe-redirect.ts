/** Valida path interno para redirect pós-OAuth (evita open redirect). */
export function sanitizeInternalRedirectPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || typeof next !== 'string') return fallback
  const trimmed = next.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  if (trimmed.includes('://')) return fallback
  return trimmed
}
