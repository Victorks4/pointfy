'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import type { User } from '@/lib/types'

/** Sincroniza perfil validado no servidor com o AuthProvider (produção / F5). */
export function DashboardAuthHydrate({ user }: { user: User }) {
  const { hydrateUser } = useAuth()

  useEffect(() => {
    hydrateUser(user)
  }, [user, hydrateUser])

  return null
}
