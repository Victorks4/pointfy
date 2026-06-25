'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react'
import { signOutAction } from '@/app/actions/auth'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { clearDashboardDataPrefetch, prefetchDashboardData } from '@/lib/data-api'
import type { User } from './types'
import type { ProfileRow } from '@/lib/server/db-types'
import { mapProfile } from '@/lib/server/mappers'

interface AuthContextType {
  user: User | null
  login: (email: string, senha: string) => Promise<User | null>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const PROFILE_COLUMNS =
  'id,email,ra,nome,cargo,departamento,carga_horaria_semanal,data_inicio_recesso,data_fim_recesso,gestor_id,created_at'

async function fetchProfile(userId: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return mapProfile(data as ProfileRow)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const isLoggingOut = useRef(false)
  const skipAuthListener = useRef(false)
  const profileInflight = useRef<Map<string, Promise<User | null>>>(new Map())

  const loadUser = useCallback(async (userId: string): Promise<User | null> => {
    const existing = profileInflight.current.get(userId)
    if (existing) return existing

    const promise = fetchProfile(userId)
      .then((profile) => {
        setUser(profile)
        return profile
      })
      .finally(() => {
        profileInflight.current.delete(userId)
      })

    profileInflight.current.set(userId, promise)
    return promise
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          await loadUser(session.user.id)
        }
      } finally {
        setIsLoading(false)
      }
    }
    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isLoggingOut.current || skipAuthListener.current) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        return
      }

      if (
        session?.user &&
        (event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED')
      ) {
        await loadUser(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, loadUser])

  const login = async (email: string, senha: string): Promise<User | null> => {
    if (!isSupabaseConfigured()) {
      console.error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env')
      return null
    }

    skipAuthListener.current = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) {
        console.error('Login Supabase:', error.message)
        return null
      }
      if (!data.user) return null

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        console.error('Sessão não persistida após login')
        return null
      }

      const profile = await loadUser(data.user.id)
      if (!profile) {
        console.error(
          'Usuário autenticado mas sem perfil em profiles. Rode as migrations SQL e: npm run db:seed',
        )
        return null
      }

      clearDashboardDataPrefetch()
      prefetchDashboardData()
      return profile
    } finally {
      skipAuthListener.current = false
    }
  }

  const logout = async () => {
    isLoggingOut.current = true
    setUser(null)
    clearDashboardDataPrefetch()
    try {
      await signOutAction()
      await supabase.auth.signOut({ scope: 'global' })
    } finally {
      isLoggingOut.current = false
    }
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
