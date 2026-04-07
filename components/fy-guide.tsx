'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { FY_NAME, getFyDockRotationTips, resolveFyBubbleMessage } from '@/lib/fy-mascot'
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
import { Minimize2, ChevronLeft, ChevronRight, Route } from 'lucide-react'
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
    if (anchorId !== 'fy-sidebar-menu' && anchorId !== 'fy-sidebar-admin') return
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

  const isAdmin = user?.cargo === 'admin'
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
        hasPontoHoje,
        unreadNotifications,
      }),
    [pathname, isAdmin, hasPontoHoje, unreadNotifications],
  )

  const tips = useMemo(() => {
    const roleTips = [...getFyDockRotationTips(Boolean(isAdmin))]
    return [bubble.text, ...roleTips]
  }, [bubble.text, isAdmin])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setTipIndex(0)
  }, [pathname, bubble.text])

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
    if (isAdmin) return null
    if (pathname.startsWith('/dashboard/ponto') && !hasPontoHoje) return 'fy-save-ponto'
    if (pathname === '/dashboard' && streakAtual >= 3) return 'fy-streak'
    return null
  }, [tour.isTourActive, isAdmin, pathname, hasPontoHoje, streakAtual])

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

  const dashboardHref = isAdmin ? '/dashboard/admin' : '/dashboard'

  if (tour.uiMode === 'entrance') {
    return null
  }

  if (tour.uiMode === 'fab') {
    return (
      <div className="fixed bottom-5 right-5 z-[51] flex flex-col items-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="pointer-events-auto h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-sky-600 bg-white p-0 shadow-md shadow-sky-900/10 transition-transform hover:scale-105 hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-label={`Menu do ${FY_NAME}: atalhos e tour`}
            >
              <span className="sr-only">Abrir menu do assistente</span>
              <FyChromaVideo src={VIDEO_SRC} layout="fab" canvasBaseWidth={128} className="pointer-events-none" />
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
            {!isAdmin ? (
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
    <aside
      data-fy-pet-dock
      aria-label={`${FY_NAME}, assistente do Pontify`}
      className={cn(
        'fixed bottom-5 right-5 z-[51] flex max-w-[min(calc(100vw-1.25rem),22rem)] flex-col items-end gap-2',
        tour.isTourActive || tour.uiMode === 'dock' ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      <div
        className={cn(
          'relative w-full rounded-2xl border border-sky-200/90 bg-white/95 shadow-lg shadow-sky-900/10 ring-1 ring-sky-100 backdrop-blur-sm',
          tour.uiMode === 'exiting' && 'animate-out fade-out zoom-out-95 duration-500',
          !tour.isTourActive &&
            tour.uiMode !== 'dock' &&
            tour.uiMode !== 'exiting' &&
            'pointer-events-none',
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
            </div>
          ) : null}
          {tour.uiMode === 'dock' && !tour.isTourActive ? (
            <div className="mt-2 flex justify-end border-t border-sky-100 pt-2">
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
              <Button type="button" variant="ghost" size="sm" className="text-sky-700" onClick={() => tour.startTourFromMenu()}>
                Ver tour
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
          prefersReducedMotion ? '' : 'animate-fy-pet-jump',
          tour.uiMode === 'exiting' && 'animate-out fade-out slide-out-to-bottom-4 duration-500',
          !tour.isTourActive && tour.uiMode !== 'exiting' && 'pointer-events-none',
        )}
      >
        <FyChromaVideo src={VIDEO_SRC} className="drop-shadow-xl" />
      </div>
    </aside>
  )
}
