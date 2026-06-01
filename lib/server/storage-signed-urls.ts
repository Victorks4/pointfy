import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'justificativas'
const EXPIRES_SEC = 3600

/** Gera URLs assinadas em lote (evita N+1 de createSignedUrl). */
export async function signedUrlsForPaths(
  supabase: SupabaseClient,
  paths: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))]
  const map = new Map<string, string>()
  if (unique.length === 0) return map

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(unique, EXPIRES_SEC)

  if (error) {
    console.error('createSignedUrls:', error.message)
    return map
  }

  for (let i = 0; i < unique.length; i++) {
    const signed = data?.[i]?.signedUrl
    if (signed) map.set(unique[i], signed)
  }
  return map
}

export async function signedUrlForPath(
  supabase: SupabaseClient,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null
  const map = await signedUrlsForPaths(supabase, [path])
  return map.get(path) ?? path
}
