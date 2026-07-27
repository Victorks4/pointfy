import { headers } from 'next/headers'

/** Origem absoluta do site (redirects de auth Supabase). */
export async function getSiteOrigin(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl) return envUrl.replace(/\/$/, '')

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }

  return 'http://localhost:3000'
}

export function buildPasswordResetRedirectUrl(origin: string): string {
  const callback = `${origin}/auth/callback?next=${encodeURIComponent('/auth/redefinir-senha')}`
  return callback
}
