'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

const LOGIN_PATHS = new Set(['/', '/auth/callback'])

function isLoginPath(pathname: string | null): boolean {
  if (!pathname) return false
  return LOGIN_PATHS.has(pathname)
}

/**
 * Login permanece claro sem sobrescrever a preferência salva (pontify-theme).
 * No dashboard, o ThemeProvider controla .dark no <html> via setTheme.
 */
export function ThemeScope({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const onLogin = isLoginPath(pathname)

  useEffect(() => {
    if (!onLogin) return

    const html = document.documentElement
    const lockLight = () => {
      if (html.classList.contains('dark')) {
        html.classList.remove('dark')
      }
    }

    lockLight()
    const observer = new MutationObserver(lockLight)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [onLogin])

  return <>{children}</>
}
