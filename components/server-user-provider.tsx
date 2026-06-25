'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { User } from '@/lib/types'

const ServerUserContext = createContext<User | null>(null)

/** Perfil validado no servidor — fonte confiável no dashboard (produção / F5). */
export function ServerUserProvider({ user, children }: { user: User; children: ReactNode }) {
  return <ServerUserContext.Provider value={user}>{children}</ServerUserContext.Provider>
}

export function useServerUser(): User | null {
  return useContext(ServerUserContext)
}
