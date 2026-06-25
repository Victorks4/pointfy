'use client'

import { useLayoutEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import type { User } from '@/lib/types'

/** Sincroniza perfil do servidor com o AuthProvider antes da pintura. */
export function DashboardAuthHydrate({ user }: { user: User }) {
  const { hydrateUser } = useAuth()

  useLayoutEffect(() => {
    hydrateUser(user)
  }, [user, hydrateUser])

  return null
}
