'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { useFy } from '@/lib/fy-context'
import {
  FY_ADMIN_FIRST_VISIT_FLOW,
  FY_FIRST_VISIT_FLOW,
  FY_NAME,
  getFyOnboardingSessionDismissKey,
  getFyOnboardingStorageKey,
  resolveFyBubbleMessage,
  type FyEmotion,
} from '@/lib/fy-mascot'
import { calcularSequenciaAtual, getTodayString } from '@/lib/time-utils'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X } from 'lucide-react'

const FyMascot3dLazy = dynamic(
  () => import('@/components/fy/fy-mascot-3d').then((m) => m.FyMascot3d),
  {
    ssr: false,
    loading: () => <div className="h-[52px] w-[52px] rounded-full bg-primary/25 animate-pulse" />,
  },
)

const FyMascot3dTourLazy = dynamic(
  () => import('@/components/fy/fy-mascot-3d').then((m) => m.FyMascot3d),
  {
    ssr: false,
    loading: () => (
      <div className="h-20 w-20 shrink-0 rounded-2xl bg-primary/20 animate-pulse sm:h-24 sm:w-24" />
    ),
  },
)

const BUBBLE_WIDTH_CLASS = 'w-[min(calc(100vw-2.5rem),22rem)]'

function emotionStyles(emotion: FyEmotion): string {
  const map: Record<FyEmotion, string> = {
    alegria: 'border-emerald-200/80 bg-emerald-50/50 text-emerald-950',
    aviso: 'border-blue-300/80 bg-blue-50/70 text-blue-950',
    atencao: 'border-sky-400/70 bg-sky-50/80 text-sky-950',
    neutro: 'border-border bg-muted/40 text-foreground',
  }
  return map[emotion]
}

export function FyGuide() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { getPontoByDate, getNotificacoesByUser, getPontosByUser } = useData()
  const prefersReducedMotion = usePrefersReducedMotion()
  const {
    userId,
    isAdmin,
    tourSignal,
    restartOnboarding,
    setHighlightAnchorId,
    setAnimationPhase,
    setPointAngleRad,
    highlightAnchorId,
    animationPhase,
  } = useFy()

  const flow = useMemo(() => (isAdmin ? FY_ADMIN_FIRST_VISIT_FLOW : FY_FIRST_VISIT_FLOW), [isAdmin])
  const variant = isAdmin ? 'admin' : 'estagiario'
  const storageKey = useMemo(() => getFyOnboardingStorageKey(userId, variant), [userId, variant])
  const sessionDismissKey = useMemo(() => getFyOnboardingSessionDismissKey(userId, variant), [userId, variant])

  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const hasPontoHoje = Boolean(user && getPontoByDate(user.id, getTodayString()))
  const unreadNotifications = user ? getNotificacoesByUser(user.id).filter((n) => !n.lida).length : 0

  const pontos = user ? getPontosByUser(user.id) : []
  const streakAtual = useMemo(
    () => calcularSequenciaAtual(pontos.map((p) => p.data)),
    [pontos],
  )

  const bubble = useMemo(
    () =>
      resolveFyBubbleMessage({
        pathname,
        isAdmin,
        hasPontoHoje,
        unreadNotifications,
      }),
    [pathname, isAdmin, hasPontoHoje, unreadNotifications],
  )

  const openOnboarding = useCallback(() => {
    setStepIndex(0)
    setHelpOpen(false)
    setOnboardingOpen(true)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    if (tourSignal > 0) {
      openOnboarding()
    }
  }, [tourSignal, mounted, openOnboarding])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    if (tourSignal > 0) return
    const done = window.localStorage.getItem(storageKey)
    const dismissed = window.sessionStorage.getItem(sessionDismissKey)
    if (!done && !dismissed) {
      const t = window.setTimeout(() => openOnboarding(), 400)
      return () => window.clearTimeout(t)
    }
  }, [mounted, storageKey, sessionDismissKey, tourSignal, openOnboarding])

  const dismissTourForSessionRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return
    const nodes = document.querySelectorAll('.fy-spotlight-active')
    nodes.forEach((n) => n.classList.remove('fy-spotlight-active'))
    if (!highlightAnchorId) return
    const el = document.querySelector(`[data-fy-anchor="${highlightAnchorId}"]`)
    el?.classList.add('fy-spotlight-active')
    return () => {
      el?.classList.remove('fy-spotlight-active')
    }
  }, [highlightAnchorId, mounted])

  useEffect(() => {
    if (!mounted) return
    if (!highlightAnchorId || onboardingOpen || helpOpen) {
      setPointAngleRad(0)
      return
    }
    let raf = 0
    const loop = () => {
      const el = document.querySelector(`[data-fy-anchor="${highlightAnchorId}"]`)
      if (el && typeof window !== 'undefined') {
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const fabX = window.innerWidth - 40
        const fabY = window.innerHeight - 40
        const dx = cx - fabX
        const dy = cy - fabY
        setPointAngleRad(Math.atan2(dx, -dy))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [highlightAnchorId, onboardingOpen, helpOpen, mounted, setPointAngleRad])

  useEffect(() => {
    if (!mounted) return
    if (onboardingOpen) {
      setHighlightAnchorId(null)
      setPointAngleRad(0)
      setAnimationPhase('explaining')
      return
    }
    if (helpOpen) {
      setHighlightAnchorId(null)
      setPointAngleRad(0)
      setAnimationPhase('explaining')
      return
    }
    if (isAdmin) {
      setHighlightAnchorId(null)
      setPointAngleRad(0)
      setAnimationPhase('idle')
      return
    }
    if (pathname.startsWith('/dashboard/ponto') && !hasPontoHoje) {
      setHighlightAnchorId('fy-save-ponto')
      if (animationPhase !== 'celebrate') setAnimationPhase('pointing')
      return
    }
    if (pathname === '/dashboard' && streakAtual >= 3) {
      setHighlightAnchorId('fy-streak')
      if (animationPhase !== 'celebrate') setAnimationPhase('idle')
      return
    }
    setHighlightAnchorId(null)
    setPointAngleRad(0)
    if (animationPhase === 'celebrate') return
    const emotionPhase: Record<FyEmotion, 'idle' | 'pointing' | 'explaining' | 'alert' | 'celebrate'> = {
      atencao: 'alert',
      aviso: 'explaining',
      alegria: 'idle',
      neutro: 'idle',
    }
    setAnimationPhase(emotionPhase[bubble.emotion])
  }, [
    mounted,
    onboardingOpen,
    helpOpen,
    isAdmin,
    pathname,
    hasPontoHoje,
    streakAtual,
    bubble.emotion,
    animationPhase,
    setHighlightAnchorId,
    setAnimationPhase,
    setPointAngleRad,
  ])

  const dismissTourForSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(sessionDismissKey, '1')
    }
    setOnboardingOpen(false)
  }, [sessionDismissKey])

  dismissTourForSessionRef.current = dismissTourForSession

  useEffect(() => {
    if (!onboardingOpen && !helpOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (onboardingOpen) dismissTourForSessionRef.current()
      else setHelpOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onboardingOpen, helpOpen])

  const finishOnboarding = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, '1')
      window.sessionStorage.removeItem(sessionDismissKey)
    }
    setOnboardingOpen(false)
    setStepIndex(0)
  }, [storageKey, sessionDismissKey])

  const step = flow[stepIndex]
  const progressPercent = flow.length > 0 ? ((stepIndex + 1) / flow.length) * 100 : 0
  const currentStepRoute = step?.rotaSugerida

  const togglePet = useCallback(() => {
    if (onboardingOpen) return
    setHelpOpen((h) => !h)
  }, [onboardingOpen])

  if (!mounted) return null

  return (
    <aside
      data-fy-pet-dock
      aria-label={`${FY_NAME}, assistente do Pontify`}
      className="fixed bottom-5 right-5 z-50 flex max-h-[calc(100dvh-1.25rem)] flex-col items-end gap-3"
    >
      {onboardingOpen ? (
        <div
          className={`relative ${BUBBLE_WIDTH_CLASS} origin-bottom-right animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200`}
          role="region"
          aria-labelledby="fy-tour-title"
        >
          <div
            className="pointer-events-auto rounded-2xl border border-border bg-card/95 text-card-foreground shadow-xl shadow-primary/10 ring-1 ring-primary/15 backdrop-blur-md supports-[backdrop-filter]:bg-card/85"
          >
            <div className="absolute -bottom-1.5 right-12 z-10 h-3 w-3 rotate-45 border border-border border-t-0 border-l-0 bg-card" aria-hidden />
            <div className="relative flex flex-col gap-3 p-4 pb-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="relative shrink-0">
                    {prefersReducedMotion ? (
                      <Image
                        src="/fy-mascote.png"
                        alt=""
                        width={88}
                        height={88}
                        className="h-20 w-20 rounded-2xl object-contain sm:h-24 sm:w-24"
                        priority
                      />
                    ) : (
                      <FyMascot3dTourLazy variant="tour" className="shadow-sm" />
                    )}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p id="fy-tour-title" className="text-base font-semibold leading-tight">
                      {step?.titulo ?? FY_NAME}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tour · {stepIndex + 1}/{flow.length}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  onClick={dismissTourForSession}
                  aria-label="Fechar tour por agora"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Progress value={progressPercent} className="h-1" />
              <p className="text-sm leading-relaxed text-foreground">{step?.mensagem}</p>
              <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
                {currentStepRoute ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      dismissTourForSession()
                      router.push(currentStepRoute)
                    }}
                  >
                    Abrir esta página
                  </Button>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={finishOnboarding}>
                    Pular tour
                  </Button>
                  <div className="flex gap-2">
                    {stepIndex > 0 ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => setStepIndex((i) => i - 1)}>
                        Voltar
                      </Button>
                    ) : null}
                    {stepIndex < flow.length - 1 ? (
                      <Button type="button" size="sm" onClick={() => setStepIndex((i) => i + 1)}>
                        Próximo
                      </Button>
                    ) : (
                      <Button type="button" size="sm" onClick={finishOnboarding}>
                        Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {helpOpen && !onboardingOpen ? (
        <div
          className={`relative ${BUBBLE_WIDTH_CLASS} origin-bottom-right animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200`}
          role="dialog"
          aria-label={`Dica do ${FY_NAME}`}
          aria-live="polite"
        >
          <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 text-card-foreground shadow-lg ring-1 ring-border/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/90">
            <div className="absolute -bottom-1.5 right-12 z-10 h-3 w-3 rotate-45 border border-border border-t-0 border-l-0 bg-card" aria-hidden />
            <div className="relative space-y-3 p-4 pb-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{FY_NAME}</p>
                  <p className="text-xs text-muted-foreground">Dica rápida</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setHelpOpen(false)}
                  aria-label="Fechar dica"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className={`rounded-xl border p-3 text-sm leading-relaxed ${emotionStyles(bubble.emotion)}`}>
                {bubble.text}
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setHelpOpen(false)
                    router.push('/dashboard/ponto')
                  }}
                >
                  Ir para registro de ponto
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setHelpOpen(false)
                    router.push(isAdmin ? '/dashboard/admin' : '/dashboard')
                  }}
                >
                  {isAdmin ? 'Painel admin' : 'Dashboard'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    restartOnboarding()
                    setHelpOpen(false)
                  }}
                >
                  Refazer tour guiado
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={togglePet}
        aria-expanded={helpOpen || onboardingOpen}
        aria-haspopup="dialog"
        aria-label={
          onboardingOpen
            ? `${FY_NAME} — tour visível acima`
            : helpOpen
              ? `Fechar dicas do ${FY_NAME}`
              : `Abrir dicas do ${FY_NAME}`
        }
        className="group pointer-events-auto relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/35 ring-2 ring-background transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full bg-primary-foreground/10">
          {onboardingOpen || prefersReducedMotion ? (
            <Image src="/fy-mascote.png" alt="" width={44} height={44} className="object-contain p-0.5" />
          ) : (
            <FyMascot3dLazy variant="fab" />
          )}
        </span>
        {unreadNotifications > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        ) : null}
      </button>
    </aside>
  )
}
