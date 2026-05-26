/**
 * URL base do projeto Supabase (sem /rest/v1 nem barra final).
 * Copie de Settings → General → Project URL, NÃO da Data API.
 */
export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  if (!raw) return ''

  let url = raw.replace(/\/+$/, '')
  // Erro comum: colar URL da Data API com /rest/v1
  url = url.replace(/\/rest\/v1\/?$/i, '')

  return url
}

export function assertSupabaseUrl(): string {
  const url = getSupabaseUrl()
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não definida')
  }
  if (/\/rest\/v1/i.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')) {
    console.warn(
      '[pointfy] Remova /rest/v1 da NEXT_PUBLIC_SUPABASE_URL. Use só: https://SEU-PROJETO.supabase.co',
    )
  }
  return url
}
