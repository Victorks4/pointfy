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
  hydrateUser: (profile: User) => void
  retryProfileLoad: () => Promise<void>
  isLoading: boolean
  profileError: string | null
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
  const [profileError, setProfileError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const isLoggingOut = useRef(false)
  const skipAuthListener = useRef(false)
  const profileInflight = useRef<Map<string, Promise<User | null>>>(new Map())
  const authUserIdRef = useRef<string | null>(null)
  const serverProfileRef = useRef<User | null>(null)

  const loadUser = useCallback(async (userId: string): Promise<User | null> => {
    authUserIdRef.current = userId
    const existing = profileInflight.current.get(userId)
    if (existing) return existing

    const promise = fetchProfile(userId)
      .then((profile) => {
        if (profile) {
          setProfileError(null)
          setUser(profile)
        } else if (!serverProfileRef.current) {
          setProfileError('Não foi possível carregar seu perfil.')
          setUser(null)
        }
        return profile
      })
      .finally(() => {
        profileInflight.current.delete(userId)
      })

    profileInflight.current.set(userId, promise)
    return promise
  }, [])

  const scheduleProfileLoad = useCallback(
    (userId: string) => {
      if (serverProfileRef.current?.id === userId) return
      window.setTimeout(() => {
        void loadUser(userId)
      }, 0)
    },
    [loadUser],
  )

  const retryProfileLoad = useCallback(async () => {
    const userId = authUserIdRef.current ?? serverProfileRef.current?.id
    if (!userId) return
    profileInflight.current.delete(userId)
    setProfileError(null)
    await loadUser(userId)
  }, [loadUser])

  const hydrateUser = useCallback((profile: User) => {
    serverProfileRef.current = profile
    authUserIdRef.current = profile.id
    setUser(profile)
    setProfileError(null)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isLoggingOut.current || skipAuthListener.current) return

      // SIGNED_OUT espúrio ignorado; sessão real expirada confirmada via getUser
      if (event === 'SIGNED_OUT') {
        if (isLoggingOut.current) {
          serverProfileRef.current = null
          authUserIdRef.current = null
          setUser(null)
          setProfileError(null)
          return
        }
        window.setTimeout(() => {
          void supabase.auth.getUser().then(({ data: { user: authUser } }) => {
            if (!authUser) {
              serverProfileRef.current = null
              authUserIdRef.current = null
              setUser(null)
              setProfileError(null)
            }
          })
        }, 0)
        return
      }

      if (session?.user) {
        scheduleProfileLoad(session.user.id)
      }
    })

    window.setTimeout(() => {
      if (cancelled || serverProfileRef.current) {
        if (!cancelled) setIsLoading(false)
        return
      }

      void (async () => {
        try {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser()

          if (cancelled || serverProfileRef.current) return

          if (authUser) {
            await loadUser(authUser.id)
          }
        } finally {
          if (!cancelled) setIsLoading(false)
        }
      })()
    }, 0)

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase.auth, loadUser, scheduleProfileLoad])

  const login = useCallback(async (email: string, senha: string): Promise<User | null> => {
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

      const profile = await loadUser(data.user.id)
      if (!profile) {
        console.error(
          'Usuário autenticado mas sem perfil em profiles. Rode as migrations SQL e: npm run db:seed',
        )
        return null
      }

      serverProfileRef.current = profile
      clearDashboardDataPrefetch()
      prefetchDashboardData()
      return profile
    } finally {
      skipAuthListener.current = false
    }
  }, [supabase.auth, loadUser])

  const logout = useCallback(async () => {
    isLoggingOut.current = true
    serverProfileRef.current = null
    authUserIdRef.current = null
    setUser(null)
    setProfileError(null)
    clearDashboardDataPrefetch()
    try {
      await signOutAction()
      await supabase.auth.signOut({ scope: 'global' })
    } finally {
      isLoggingOut.current = false
      window.location.assign('/')
    }
  }, [supabase.auth])

  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      hydrateUser,
      retryProfileLoad,
      isLoading,
      profileError,
    }),
    [user, login, logout, hydrateUser, retryProfileLoad, isLoading, profileError],
  )

  return (
    <AuthContext.Provider value={contextValue}>
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
