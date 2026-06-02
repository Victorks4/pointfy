'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ThemeProvider } from '@/components/theme-provider'

const LOGIN_PATHS = new Set(['/', '/auth/callback'])

function isLoginPath(pathname: string | null): boolean {
  if (!pathname) return false
  return LOGIN_PATHS.has(pathname)
}

/**
 * Login sempre claro (forcedTheme) sem brigar com o DOM via MutationObserver.
 * No dashboard, a preferência em localStorage (pontify-theme) volta a valer.
 */
export function PontifyThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const onLogin = isLoginPath(pathname)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="pontify-theme"
      disableTransitionOnChange
      forcedTheme={onLogin ? 'light' : undefined}
    >
      {children}
    </ThemeProvider>
  )
}
