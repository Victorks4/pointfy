'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getFyOnboardingSessionDismissKey, getFyOnboardingStorageKey } from '@/lib/fy-mascot'

export type FyAnimationPhase = 'idle' | 'pointing' | 'explaining' | 'alert' | 'celebrate'

export type FyContextValue = {
  restartOnboarding: () => void
  userId: string
  isAdmin: boolean
  tourSignal: number
  animationPhase: FyAnimationPhase
  highlightAnchorId: string | null
  pointAngleRad: number
  celebrateNonce: number
  setAnimationPhase: (phase: FyAnimationPhase) => void
  setHighlightAnchorId: (id: string | null) => void
  setPointAngleRad: (rad: number) => void
  pulseCelebrate: () => void
}

const FyContext = createContext<FyContextValue | null>(null)

export function FyProvider({
  userId,
  isAdmin,
  children,
}: {
  userId: string
  isAdmin: boolean
  children: ReactNode
}) {
  const [tourSignal, setTourSignal] = useState(0)
  const [animationPhase, setAnimationPhase] = useState<FyAnimationPhase>('idle')
  const [highlightAnchorId, setHighlightAnchorId] = useState<string | null>(null)
  const [pointAngleRad, setPointAngleRad] = useState(0)
  const [celebrateNonce, setCelebrateNonce] = useState(0)
  const celebrateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const restartOnboarding = useCallback(() => {
    if (typeof window === 'undefined') return
    const variant = isAdmin ? 'admin' : 'estagiario'
    window.localStorage.removeItem(getFyOnboardingStorageKey(userId, variant))
    window.sessionStorage.removeItem(getFyOnboardingSessionDismissKey(userId, variant))
    setTourSignal((n) => n + 1)
  }, [userId, isAdmin])

  const pulseCelebrate = useCallback(() => {
    if (celebrateTimeoutRef.current) clearTimeout(celebrateTimeoutRef.current)
    setCelebrateNonce((n) => n + 1)
    setAnimationPhase('celebrate')
    celebrateTimeoutRef.current = setTimeout(() => {
      setAnimationPhase((p) => (p === 'celebrate' ? 'idle' : p))
      celebrateTimeoutRef.current = null
    }, 1400)
  }, [])

  const value = useMemo(
    () => ({
      restartOnboarding,
      userId,
      isAdmin,
      tourSignal,
      animationPhase,
      highlightAnchorId,
      pointAngleRad,
      celebrateNonce,
      setAnimationPhase,
      setHighlightAnchorId,
      setPointAngleRad,
      pulseCelebrate,
    }),
    [
      restartOnboarding,
      userId,
      isAdmin,
      tourSignal,
      animationPhase,
      highlightAnchorId,
      pointAngleRad,
      celebrateNonce,
      pulseCelebrate,
    ],
  )

  return <FyContext.Provider value={value}>{children}</FyContext.Provider>
}

export function useFy(): FyContextValue {
  const ctx = useContext(FyContext)
  if (!ctx) {
    throw new Error('useFy must be used within FyProvider')
  }
  return ctx
}
