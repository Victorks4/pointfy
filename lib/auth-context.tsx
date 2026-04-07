'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { findDemoLoginUser } from '@/lib/demo-users'
import type { User } from './types'

interface AuthContextType {
  user: User | null
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar se há usuário salvo no sessionStorage
    const savedUser = sessionStorage.getItem('currentUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, senha: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 280))

    const foundUser = findDemoLoginUser(email, senha)
    if (foundUser) {
      setUser(foundUser)
      sessionStorage.setItem('currentUser', JSON.stringify(foundUser))
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('currentUser')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
