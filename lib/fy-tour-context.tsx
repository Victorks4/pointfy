'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  FY_ADMIN_FIRST_VISIT_FLOW,
  FY_FIRST_VISIT_FLOW,
  getFyOnboardingStorageKey,
  fyPathnameMatchesRoute,
  type FyOnboardingStep,
} from '@/lib/fy-mascot'

export type FyUiMode = 'hydrating' | 'entrance' | 'tour' | 'exiting' | 'fab' | 'dock'

type FyTourContextValue = {
  uiMode: FyUiMode
  tourStepIndex: number
  flow: FyOnboardingStep[]
  variant: 'estagiario' | 'admin'
  hasCompletedOnboarding: boolean
  startTourFromMenu: () => void
  nextTourStep: () => void
  prevTourStep: () => void
  skipTour: () => void
  completeTourAndCollapse: () => void
  expandDock: () => void
  collapseToFab: () => void
  currentStep: FyOnboardingStep | undefined
  isTourActive: boolean
  showEntrance: boolean
}

const FyTourContext = createContext<FyTourContextValue | null>(null)

const ENTRANCE_MS = 2600
const EXIT_MS = 720

export function useFyTour(): FyTourContextValue {
  const ctx = useContext(FyTourContext)
  if (!ctx) {
    throw new Error('useFyTour must be used within FyTourProvider')
  }
  return ctx
}

export function FyTourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const variant: 'estagiario' | 'admin' = user?.cargo === 'admin' ? 'admin' : 'estagiario'
  const flow = variant === 'admin' ? FY_ADMIN_FIRST_VISIT_FLOW : FY_FIRST_VISIT_FLOW

  const [uiMode, setUiMode] = useState<FyUiMode>('hydrating')
  const [tourStepIndex, setTourStepIndex] = useState(0)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  const storageKey = user ? getFyOnboardingStorageKey(user.id, variant) : ''

  useEffect(() => {
    if (!user || !storageKey) return
    const done = globalThis.localStorage.getItem(storageKey) === '1'
    setHasCompletedOnboarding(done)
    if (done) {
      setUiMode('fab')
    } else {
      setUiMode('entrance')
      setTourStepIndex(0)
    }
  }, [user, storageKey])

  useEffect(() => {
    if (uiMode !== 'entrance') return
    const timer = globalThis.setTimeout(() => {
      setUiMode('tour')
    }, ENTRANCE_MS)
    return () => globalThis.clearTimeout(timer)
  }, [uiMode])

  useEffect(() => {
    if (uiMode !== 'tour') return
    const step = flow[tourStepIndex]
    if (!step?.rotaSugerida) return
    if (!fyPathnameMatchesRoute(pathname, step.rotaSugerida)) {
      router.push(step.rotaSugerida)
    }
  }, [uiMode, tourStepIndex, flow, pathname, router])

  const persistComplete = useCallback(() => {
    if (!storageKey) return
    globalThis.localStorage.setItem(storageKey, '1')
    setHasCompletedOnboarding(true)
  }, [storageKey])

  const completeTourAndCollapse = useCallback(() => {
    persistComplete()
    setUiMode('exiting')
    globalThis.setTimeout(() => {
      setUiMode('fab')
    }, EXIT_MS)
  }, [persistComplete])

  const skipTour = useCallback(() => {
    persistComplete()
    setUiMode('exiting')
    globalThis.setTimeout(() => {
      setUiMode('fab')
    }, EXIT_MS)
  }, [persistComplete])

  const nextTourStep = useCallback(() => {
    setTourStepIndex((prev) => {
      if (prev >= flow.length - 1) return prev
      return prev + 1
    })
  }, [flow.length])

  const prevTourStep = useCallback(() => {
    setTourStepIndex((i) => Math.max(0, i - 1))
  }, [])

  const startTourFromMenu = useCallback(() => {
    setTourStepIndex(0)
    setUiMode('tour')
    const first = flow[0]
    if (first?.rotaSugerida && !fyPathnameMatchesRoute(pathname, first.rotaSugerida)) {
      router.push(first.rotaSugerida)
    }
  }, [flow, pathname, router])

  const expandDock = useCallback(() => {
    setUiMode('dock')
  }, [])

  const collapseToFab = useCallback(() => {
    if (hasCompletedOnboarding) {
      setUiMode('fab')
    }
  }, [hasCompletedOnboarding])

  const currentStep = flow[tourStepIndex]
  const isTourActive = uiMode === 'tour'
  const showEntrance = uiMode === 'entrance'

  const value = useMemo(
    () => ({
      uiMode,
      tourStepIndex,
      flow,
      variant,
      hasCompletedOnboarding,
      startTourFromMenu,
      nextTourStep,
      prevTourStep,
      skipTour,
      completeTourAndCollapse,
      expandDock,
      collapseToFab,
      currentStep,
      isTourActive,
      showEntrance,
    }),
    [
      uiMode,
      tourStepIndex,
      flow,
      variant,
      hasCompletedOnboarding,
      startTourFromMenu,
      nextTourStep,
      prevTourStep,
      skipTour,
      completeTourAndCollapse,
      expandDock,
      collapseToFab,
      currentStep,
      isTourActive,
      showEntrance,
    ],
  )

  return <FyTourContext.Provider value={value}>{children}</FyTourContext.Provider>
}
