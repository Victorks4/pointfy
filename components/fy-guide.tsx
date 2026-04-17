'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { FY_NAME, getFyDockRotationTips, resolveFyBubbleMessage, type FyTipRole, type FyMood } from '@/lib/fy-mascot'
import { useFyTour } from '@/lib/fy-tour-context'
import { calcularSequenciaAtual, getTodayString } from '@/lib/time-utils'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FyChromaVideo } from '@/components/fy-chroma-video'
import { FyFaqDialog } from '@/components/fy-faq-dialog'
import { FyMotionWrapper } from '@/components/fy/fy-motion-wrapper'
import { FyReactionParticles } from '@/components/fy/fy-reaction-particles'
import { FySleepZ } from '@/components/fy/fy-sleep-z'
import { fyEmit } from '@/lib/fy-event-bus'
import { Minimize2, ChevronLeft, ChevronRight, Route, CircleHelp } from 'lucide-react'
import { cn } from '@/lib/utils'

const VIDEO_SRC = '/Video_teste_Fy.mp4'
const TIP_ROTATE_MS = 9000

function useTourSpotlight(anchorId: string | null | undefined, active: boolean) {
  useEffect(() => {
    if (!active) {
      document.querySelectorAll('.fy-spotlight-tour-boost').forEach((node) => {
        node.classList.remove('fy-spotlight-active', 'fy-spotlight-tour-boost')
      })
      return
    }
    document.querySelectorAll('.fy-spotlight-tour-boost').forEach((node) => {
      node.classList.remove('fy-spotlight-active', 'fy-spotlight-tour-boost')
    })
    if (!anchorId) return
    const el = document.querySelector(`[data-fy-anchor="${anchorId}"]`)
    el?.classList.add('fy-spotlight-active', 'fy-spotlight-tour-boost')
    return () => {
      el?.classList.remove('fy-spotlight-active', 'fy-spotlight-tour-boost')
    }
  }, [anchorId, active])
}

function useTourScroll(anchorId: string | null | undefined, active: boolean, stepKey: number) {
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!active || !anchorId) return
    const run = () => {
      const el = document.querySelector(`[data-fy-anchor="${anchorId}"]`)
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion ? 'auto' : 'smooth' })
      }
    }
    const id = window.requestAnimationFrame(run)
    const t = window.setTimeout(run, 400)
    return () => {
      cancelAnimationFrame(id)
      window.clearTimeout(t)
    }
  }, [active, anchorId, stepKey, prefersReducedMotion])
}

function useTourSidebarOpen(anchorId: string | null | undefined, active: boolean) {
  const { isMobile, setOpenMobile, setOpen } = useSidebar()

  useEffect(() => {
    if (!active || !anchorId) return
    if (
      anchorId !== 'fy-sidebar-menu' &&
      anchorId !== 'fy-sidebar-admin' &&
      anchorId !== 'fy-sidebar-gestor'
    )
      return
    if (isMobile) {
      setOpenMobile(true)
      return
    }
    setOpen(true)
  }, [active, anchorId, isMobile, setOpen, setOpenMobile])
}

export function FyGuide() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { getPontoByDate, getNotificacoesByUser, getPontosByUser } = useData()
  const prefersReducedMotion = usePrefersReducedMotion()
  const tour = useFyTour()

  const [mounted, setMounted] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const [faqOpen, setFaqOpen] = useState(false)
  const [isClicked, setIsClicked] = useState(false)

  // Estado de animação do Fy
  const [mood, setMood] = useState<FyMood>('neutro')
  const [isHovered, setIsHovered] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const [idleSeconds, setIdleSeconds] = useState(0)
  const [showParticles, setShowParticles] = useState(false)
  const [showSleepZ, setShowSleepZ] = useState(false)

  const isAdmin = user?.cargo === 'admin'
  const isGestor = user?.cargo === 'gestor'
  const fyTipRole: FyTipRole = isAdmin ? 'admin' : isGestor ? 'gestor' : 'estagiario'
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
        isAdmin: Boolean(isAdmin),
        isGestor: Boolean(isGestor),
        hasPontoHoje,
        unreadNotifications,
      }),
    [pathname, isAdmin, isGestor, hasPontoHoje, unreadNotifications],
  )

  const tips = useMemo(() => {
    const roleTips = [...getFyDockRotationTips(fyTipRole)]
    return [bubble.text, ...roleTips]
  }, [bubble.text, fyTipRole])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Subscription a eventos do Fy para reações
  useEffect(() => {
    const handleFyEvent = (event: ReturnType<typeof fyEmit> extends undefined ? never : { type: string; [key: string]: unknown }) => {
      // Nota: fyEmit não retorna valor, então tratamos como void
      // O evento real vem do barramento interno
    }

    // Handler para eventos do sistema
    const onPontoSaved = (success: boolean) => {
      if (success) {
        setMood('alegria')
        setShowParticles(true)
        setTimeout(() => {
          setMood('neutro')
          setShowParticles(false)
        }, 2000)
      }
    }

    const onPontoError = () => {
      setMood('aviso')
      setTimeout(() => setMood('neutro'), 1500)
    }

    const onIdleStart = () => setIsIdle(true)
    const onIdleEnd = () => {
      setIsIdle(false)
      setIdleSeconds(0)
      setShowSleepZ(false)
      setMood('neutro')
    }

    const onBored = () => setMood('entediado')
    const onSleep = () => {
      setMood('dormindo')
      setShowSleepZ(true)
    }
    const onWake = () => {
      setMood('neutro')
      setShowSleepZ(false)
      setIsIdle(false)
    }

    // Idle tracker manual
    let idleTimer: NodeJS.Timeout | null = null
    let boredomTimer: NodeJS.Timeout | null = null
    let sleepTimer: NodeJS.Timeout | null = null
    let idleCounter: NodeJS.Timeout | null = null

    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer)
      if (boredomTimer) clearTimeout(boredomTimer)
      if (sleepTimer) clearTimeout(sleepTimer)
      if (idleCounter) clearInterval(idleCounter)

      setIdleSeconds(0)

      if (isIdle || mood === 'dormindo' || mood === 'entediado') {
        onWake()
      }

      // 30s para tédio
      boredomTimer = setTimeout(() => {
        if (!isHovered && !showParticles) {
          onBored()
        }
      }, 30000)

      // 60s para dormir
      sleepTimer = setTimeout(() => {
        if (!isHovered && !showParticles) {
          onSleep()
        }
      }, 60000)

      // Contador de segundos
      idleCounter = setInterval(() => {
        setIdleSeconds((s) => s + 1)
      }, 1000)
    }

    const handleActivity = () => {
      resetIdle()
    }

    // Event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Iniciar idle tracker
    resetIdle()

    // Custom event listener para eventos do Fy
    const fyEventHandler = (event: CustomEvent) => {
      const { type, success } = event.detail || {}
      if (type === 'ponto:saved') onPontoSaved(success)
      if (type === 'ponto:error') onPontoError()
      if (type === 'fy:idle_start') onIdleStart()
      if (type === 'fy:idle_end') onIdleEnd()
      if (type === 'fy:wake') onWake()
    }

    window.addEventListener('fy-event' as never, fyEventHandler as never)

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      if (idleTimer) clearTimeout(idleTimer)
      if (boredomTimer) clearTimeout(boredomTimer)
      if (sleepTimer) clearTimeout(sleepTimer)
      if (idleCounter) clearInterval(idleCounter)
      window.removeEventListener('fy-event' as never, fyEventHandler as never)
    }
  }, [isHovered, isIdle, mood, showParticles])

  useEffect(() => {
    setTipIndex(0)
  }, [pathname, bubble.text])

  // Handlers de interação
  const handleFyHoverStart = useCallback(() => {
    setIsHovered(true)
    fyEmit({ type: 'fy:hover' })
    // Reset idle timers quando hover
    if (isIdle || mood === 'dormindo' || mood === 'entediado') {
      setMood('neutro')
      setShowSleepZ(false)
      setIsIdle(false)
    }
  }, [isIdle, mood])

  const handleFyHoverEnd = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleFyClick = useCallback(() => {
    setIsClicked(true)
    fyEmit({ type: 'fy:click' })
    setTimeout(() => setIsClicked(false), 150)
  }, [])

  useEffect(() => {
    if (tour.isTourActive) return
    if (typeof window === 'undefined' || tips.length <= 1) return
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length)
    }, TIP_ROTATE_MS)
    return () => window.clearInterval(id)
  }, [tips.length, tour.isTourActive])

  const contextualAnchorId = useMemo(() => {
    if (tour.isTourActive) return null
    if (isAdmin || isGestor) return null
    if (pathname.startsWith('/dashboard/ponto') && !hasPontoHoje) return 'fy-save-ponto'
    if (pathname === '/dashboard' && streakAtual >= 3) return 'fy-streak'
    return null
  }, [tour.isTourActive, isAdmin, isGestor, pathname, hasPontoHoje, streakAtual])

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return
    if (tour.isTourActive) return
    document.querySelectorAll('.fy-spotlight-active').forEach((n) => n.classList.remove('fy-spotlight-active'))
    if (!contextualAnchorId) return
    const el = document.querySelector(`[data-fy-anchor="${contextualAnchorId}"]`)
    el?.classList.add('fy-spotlight-active')
    return () => {
      el?.classList.remove('fy-spotlight-active')
    }
  }, [contextualAnchorId, mounted, tour.isTourActive])

  useTourSpotlight(tour.currentStep?.anchorId ?? null, tour.isTourActive)
  useTourScroll(tour.currentStep?.anchorId ?? null, tour.isTourActive, tour.tourStepIndex)
  useTourSidebarOpen(tour.currentStep?.anchorId ?? null, tour.isTourActive)

  if (!mounted || tour.uiMode === 'hydrating') return null

  const dashboardHref = isAdmin ? '/dashboard/admin' : isGestor ? '/dashboard/gestor' : '/dashboard'

  if (tour.uiMode === 'entrance') {
    return null
  }

  if (tour.uiMode === 'fab') {
    return (
      <>
        <div className="fixed bottom-5 right-5 z-[51] flex flex-col items-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'pointer-events-auto h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-sky-600 bg-white p-0 shadow-md transition-all focus-visible:ring-2 focus-visible:ring-sky-500',
                  !prefersReducedMotion && 'origin-bottom-right animate-in zoom-in-95 fade-in duration-700',
                  isHovered && 'fy-hover-active shadow-sky-900/20',
                  isClicked && 'fy-click-active',
                  mood === 'dormindo' && 'opacity-85',
                )}
                aria-label={`Menu do ${FY_NAME}: atalhos e tour`}
                onMouseEnter={handleFyHoverStart}
                onMouseLeave={handleFyHoverEnd}
                onClick={handleFyClick}
              >
                <span className="sr-only">Abrir menu do assistente</span>
                <FyMotionWrapper mood={mood} isHovered={isHovered} isClicked={isClicked}>
                  <FyChromaVideo src={VIDEO_SRC} layout="fab" canvasBaseWidth={128} className="pointer-events-none" />
                </FyMotionWrapper>
                {showParticles && <FyReactionParticles active />}
                {showSleepZ && <FySleepZ />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56">
              <DropdownMenuItem
                onSelect={() => {
                  router.push(dashboardHref)
                }}
              >
                Ir para o painel
              </DropdownMenuItem>
              {!isAdmin && !isGestor ? (
                <DropdownMenuItem
                  onSelect={() => {
                    router.push('/dashboard/ponto')
                  }}
                >
                  Bater ponto
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  setFaqOpen(true)
                }}
              >
                <CircleHelp className="mr-2 h-4 w-4" />
                Perguntas frequentes
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  tour.startTourFromMenu()
                }}
              >
                <Route className="mr-2 h-4 w-4" />
                Ver tour com o Fy
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  tour.expandDock()
                }}
              >
                Abrir mascote (dicas do Fy)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <FyFaqDialog open={faqOpen} onOpenChange={setFaqOpen} role={fyTipRole} />
      </>
    )
  }

  const bubbleLine = tour.isTourActive
    ? (tour.currentStep?.mensagem ?? '')
    : (tips[tipIndex % tips.length] ?? '')
  const stepLabel = tour.isTourActive
    ? `${tour.tourStepIndex + 1} / ${tour.flow.length}`
    : null
  const isLastTourStep = tour.isTourActive && tour.tourStepIndex >= tour.flow.length - 1

  return (
    <>
    <aside
      data-fy-pet-dock
      aria-label={`${FY_NAME}, assistente do Pontify`}
      className={cn(
        'fixed bottom-5 right-5 z-[51] flex max-w-[min(calc(100vw-1.25rem),22rem)] flex-col items-end gap-2',
        tour.uiMode === 'exiting' && 'overflow-visible',
        tour.isTourActive || tour.uiMode === 'dock' ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      <div
        className={cn(
          'relative w-full rounded-2xl border border-sky-200/90 bg-white/95 shadow-lg shadow-sky-900/10 ring-1 ring-sky-100 backdrop-blur-sm',
          tour.uiMode === 'exiting' &&
            (prefersReducedMotion ? 'fy-exit-bubble-reduced' : 'fy-exit-bubble'),
          !tour.isTourActive &&
            tour.uiMode !== 'dock' &&
            tour.uiMode !== 'exiting' &&
            'pointer-events-none',
          unreadNotifications > 0 && 'fy-bubble-attention',
          mood === 'atencao' && 'fy-bubble-attention',
        )}
        role="status"
        aria-live="polite"
      >
        <div className="px-3.5 py-2.5 text-sm leading-snug text-slate-800">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-medium text-sky-700">{FY_NAME}</span>
            {stepLabel ? (
              <span className="text-xs font-normal text-slate-500">{stepLabel}</span>
            ) : null}
          </div>
          <p className="leading-snug">{bubbleLine}</p>
          {tour.isTourActive ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sky-100 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={tour.tourStepIndex <= 0}
                onClick={() => tour.prevTourStep()}
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              {isLastTourStep ? (
                <Button type="button" size="sm" className="gap-1 bg-sky-600 hover:bg-sky-700" onClick={() => tour.completeTourAndCollapse()}>
                  Concluir
                </Button>
              ) : (
                <Button type="button" size="sm" className="gap-1 bg-sky-600 hover:bg-sky-700" onClick={() => tour.nextTourStep()}>
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" className="text-slate-500" onClick={() => tour.skipTour()}>
                Pular tour
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-sky-700"
                onClick={() => setFaqOpen(true)}
              >
                <CircleHelp className="h-4 w-4" />
                Dúvidas
              </Button>
            </div>
          ) : null}
          {tour.uiMode === 'dock' && !tour.isTourActive ? (
            <div className="mt-2 flex flex-wrap items-center justify-end gap-1 border-t border-sky-100 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-sky-700"
                onClick={() => setFaqOpen(true)}
              >
                <CircleHelp className="h-4 w-4" />
                Dúvidas
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-sky-700" onClick={() => tour.startTourFromMenu()}>
                Ver tour
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-slate-600"
                onClick={() => tour.collapseToFab()}
              >
                <Minimize2 className="h-4 w-4" />
                Minimizar
              </Button>
            </div>
          ) : null}
        </div>
        <div
          className="absolute -bottom-1.5 right-10 h-3 w-3 rotate-45 border border-sky-200/90 border-t-0 border-l-0 bg-white/95"
          aria-hidden
        />
      </div>

      <div
        className={cn(
          tour.uiMode !== 'exiting' && !prefersReducedMotion && 'animate-fy-pet-jump',
          tour.uiMode === 'exiting' &&
            (prefersReducedMotion ? 'fy-exit-mascot-reduced' : 'fy-exit-mascot'),
          !tour.isTourActive && tour.uiMode !== 'exiting' && 'pointer-events-none',
          mood === 'dormindo' && 'opacity-85',
        )}
      >
        <FyMotionWrapper mood={mood} isHovered={isHovered}>
          <FyChromaVideo src={VIDEO_SRC} className="drop-shadow-xl" />
        </FyMotionWrapper>
        {showParticles && <FyReactionParticles active />}
        {showSleepZ && <FySleepZ />}
      </div>
    </aside>
    <FyFaqDialog open={faqOpen} onOpenChange={setFaqOpen} role={fyTipRole} />
    </>
  )
}
