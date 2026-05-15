'use client'

import { createContext, useContext, type ReactNode } from 'react'

export const LOGIN_SYNC_TRANSITION = {
  pulse: {
    duration: 0.85,
    repeat: Infinity,
    repeatType: 'mirror' as const,
    ease: 'easeInOut' as const,
  },
} as const

const LoginSubmittingContext = createContext<boolean>(false)

export function LoginAmbientProvider({
  submitting,
  children,
}: {
  submitting: boolean
  children: ReactNode
}) {
  return (
    <LoginSubmittingContext.Provider value={submitting}>
      {children}
    </LoginSubmittingContext.Provider>
  )
}

export function useLoginSubmittingAmbient(): boolean {
  return useContext(LoginSubmittingContext)
}
