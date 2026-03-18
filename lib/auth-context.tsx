'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from './types'

interface AuthContextType {
  user: User | null
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Dados mock para demonstração
const MOCK_USERS: (User & { senha: string })[] = [
  {
    id: '1',
    email: 'admin@empresa.com',
    ra: 'ADM001',
    nome: 'Administrador',
    cargo: 'admin',
    departamento: 'RH',
    cargaHorariaSemanal: 2400, // 40h
    dataInicioRecesso: null,
    dataFimRecesso: null,
    createdAt: new Date().toISOString(),
    senha: 'admin123'
  },
  {
    id: '2',
    email: 'estagiario@empresa.com',
    ra: 'EST001',
    nome: 'João Silva',
    cargo: 'estagiario',
    departamento: 'TI',
    cargaHorariaSemanal: 1800, // 30h
    dataInicioRecesso: null,
    dataFimRecesso: null,
    createdAt: new Date().toISOString(),
    senha: 'est123'
  }
]

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
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const foundUser = MOCK_USERS.find(u => u.email === email && u.senha === senha)
    
    if (foundUser) {
      const { senha: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword))
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
