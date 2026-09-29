'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/client/auth-context'
import {
  FY_ADMIN_FIRST_VISIT_FLOW,
  FY_FIRST_VISIT_FLOW,
  FY_GESTOR_FIRST_VISIT_FLOW,
  getFyOnboardingStorageKey,
  getFyPendingTourStorageKey,
  fyPathnameMatchesRoute,
  type FyOnboardingStep,
} from '@/lib/fy/fy-mascot'
import { waitForTourAnchor } from '@/lib/fy/wait-for-tour-anchor'

export type FyUiMode = 'hydrating' | 'entrance' | 'tour' | 'exiting' | 'fab' | 'dock'

type FyTourContextValue = {
  uiMode: FyUiMode
  tourStepIndex: number
  flow: FyOnboardingStep[]
  variant: 'estagiario' | 'admin' | 'gestor'
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
  isStepTransitioning: boolean
  showEntrance: boolean
}

const FyTourContext = createContext<FyTourContextValue | null>(null)

const ENTRANCE_MS = 2600
/** Duração total da saída (balão + delay + mergulho do mascote) — ver `.fy-exit-mascot` em globals.css */
const EXIT_MS = 3000

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
  const variant: 'estagiario' | 'admin' | 'gestor' =
    user?.cargo === 'admin' ? 'admin' : user?.cargo === 'gestor' ? 'gestor' : 'estagiario'
  const flow =
    variant === 'admin'
      ? FY_ADMIN_FIRST_VISIT_FLOW
      : variant === 'gestor'
        ? FY_GESTOR_FIRST_VISIT_FLOW
        : FY_FIRST_VISIT_FLOW

  const [uiMode, setUiMode] = useState<FyUiMode>('hydrating')
  const [tourStepIndex, setTourStepIndex] = useState(0)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [isStepTransitioning, setIsStepTransitioning] = useState(false)
  const [pendingStepIndex, setPendingStepIndex] = useState<number | null>(null)
  const transitionGen = useRef(0)

  const storageKey = user ? getFyOnboardingStorageKey(user.id, variant) : ''
  const pendingTourKey = user ? getFyPendingTourStorageKey(user.id, variant) : ''

  useEffect(() => {
    if (!user) return
    if (!storageKey) return
    if (user.mustChangePassword || pathname === '/dashboard/alterar-senha') {
      setUiMode('fab')
      return
    }
    const done = globalThis.localStorage.getItem(storageKey) === '1'
    const pendingTour =
      pendingTourKey && globalThis.sessionStorage.getItem(pendingTourKey) === '1'
    setHasCompletedOnboarding(done)
    if (done) {
      setUiMode('fab')
    } else if (pendingTour) {
      setUiMode('entrance')
      setTourStepIndex(0)
      setPendingStepIndex(0)
      setIsStepTransitioning(true)
    } else {
      setUiMode('fab')
    }
  }, [user, storageKey, pendingTourKey, pathname])

  useEffect(() => {
    if (uiMode !== 'entrance') return
    const timer = globalThis.setTimeout(() => {
      setUiMode('tour')
    }, ENTRANCE_MS)
    return () => globalThis.clearTimeout(timer)
  }, [uiMode])

  const beginStepTransition = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= flow.length) return
      const step = flow[targetIndex]
      setIsStepTransitioning(true)
      setPendingStepIndex(targetIndex)
      if (step.rotaSugerida && !fyPathnameMatchesRoute(pathname, step.rotaSugerida)) {
        router.push(step.rotaSugerida)
      }
    },
    [flow, pathname, router],
  )

  useEffect(() => {
    if (uiMode !== 'tour' || user?.mustChangePassword) return
    if (pendingStepIndex === null) return

    const step = flow[pendingStepIndex]
    if (!step) return
    if (step.rotaSugerida && !fyPathnameMatchesRoute(pathname, step.rotaSugerida)) {
      return
    }

    const gen = ++transitionGen.current
    let cancelled = false

    void (async () => {
      await waitForTourAnchor(step.anchorId, 5000)
      if (cancelled || gen !== transitionGen.current) return
      setTourStepIndex(pendingStepIndex)
      setPendingStepIndex(null)
      setIsStepTransitioning(false)
    })()

    return () => {
      cancelled = true
    }
  }, [uiMode, pathname, pendingStepIndex, flow, user?.mustChangePassword])

  useEffect(() => {
    if (uiMode !== 'tour' || user?.mustChangePassword) return
    const idx = pendingStepIndex ?? tourStepIndex
    const step = flow[idx]
    if (!step?.rotaSugerida) return
    if (fyPathnameMatchesRoute(pathname, step.rotaSugerida)) return
    if (pendingStepIndex === null) {
      beginStepTransition(tourStepIndex)
    } else {
      setIsStepTransitioning(true)
      router.push(step.rotaSugerida)
    }
  }, [
    uiMode,
    tourStepIndex,
    pathname,
    flow,
    user?.mustChangePassword,
    pendingStepIndex,
    beginStepTransition,
    router,
  ])

  const persistComplete = useCallback(() => {
    if (!storageKey) return
    globalThis.localStorage.setItem(storageKey, '1')
    if (pendingTourKey) {
      globalThis.sessionStorage.removeItem(pendingTourKey)
    }
    setHasCompletedOnboarding(true)
  }, [storageKey, pendingTourKey])

  const completeTourAndCollapse = useCallback(() => {
    persistComplete()
    setPendingStepIndex(null)
    setIsStepTransitioning(false)
    setUiMode('exiting')
    globalThis.setTimeout(() => {
      setUiMode('fab')
    }, EXIT_MS)
  }, [persistComplete])

  const skipTour = useCallback(() => {
    persistComplete()
    setPendingStepIndex(null)
    setIsStepTransitioning(false)
    setUiMode('exiting')
    globalThis.setTimeout(() => {
      setUiMode('fab')
    }, EXIT_MS)
  }, [persistComplete])

  const nextTourStep = useCallback(() => {
    if (isStepTransitioning) return
    if (tourStepIndex >= flow.length - 1) return
    beginStepTransition(tourStepIndex + 1)
  }, [isStepTransitioning, tourStepIndex, flow.length, beginStepTransition])

  const prevTourStep = useCallback(() => {
    if (isStepTransitioning) return
    if (tourStepIndex <= 0) return
    beginStepTransition(tourStepIndex - 1)
  }, [isStepTransitioning, tourStepIndex, beginStepTransition])

  const startTourFromMenu = useCallback(() => {
    setTourStepIndex(0)
    setUiMode('tour')
    beginStepTransition(0)
  }, [beginStepTransition])

  const expandDock = useCallback(() => {
    setUiMode('dock')
  }, [])

  const collapseToFab = useCallback(() => {
    if (!hasCompletedOnboarding) return
    setUiMode('exiting')
    globalThis.setTimeout(() => {
      setUiMode('fab')
    }, EXIT_MS)
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
      isStepTransitioning,
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
      isStepTransitioning,
      showEntrance,
    ],
  )

  return <FyTourContext.Provider value={value}>{children}</FyTourContext.Provider>
}
