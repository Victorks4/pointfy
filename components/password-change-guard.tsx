'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

/** Redireciona para troca de senha quando mustChangePassword. */
export function PasswordChangeGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) {
      setReady(true)
      return
    }
    if (user.mustChangePassword && pathname !== '/dashboard/alterar-senha') {
      router.replace('/dashboard/alterar-senha')
      return
    }
    setReady(true)
  }, [user, pathname, router])

  if (!ready) return null
  return <>{children}</>
}
