import { createClient } from '@/lib/supabase/server'
import { mapProfile } from '@/lib/server/mappers'
import type { User, UserRole } from '@/lib/types'
import type { ProfileRow } from '@/lib/server/db-types'

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error || !data) return null
  return mapProfile(data as ProfileRow)
}

export async function requireAuth(): Promise<User> {
  const u = await getSessionUser()
  if (!u) throw new Error('Não autenticado')
  return u
}

export async function requireRole(...roles: UserRole[]): Promise<User> {
  const u = await requireAuth()
  if (!roles.includes(u.cargo)) throw new Error('Sem permissão')
  return u
}
