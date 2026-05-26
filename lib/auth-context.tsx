'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User } from './types'
import type { ProfileRow } from '@/lib/server/db-types'
import { mapProfile } from '@/lib/server/mappers'

interface AuthContextType {
  user: User | null
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

async function fetchProfile(userId: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error || !data) return null
  return mapProfile(data as ProfileRow)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const loadUser = useCallback(async (userId: string) => {
    const profile = await fetchProfile(userId)
    setUser(profile)
    return profile
  }, [])

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUser(session.user.id)
      }
      setIsLoading(false)
    }
    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUser(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, loadUser])

  const login = async (email: string, senha: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      console.error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env')
      return false
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      console.error('Login Supabase:', error.message)
      return false
    }
    if (!data.user) return false
    const profile = await loadUser(data.user.id)
    if (!profile) {
      console.error(
        'Usuário autenticado mas sem perfil em profiles. Rode as migrations SQL e: npm run db:seed',
      )
    }
    return !!profile
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
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
