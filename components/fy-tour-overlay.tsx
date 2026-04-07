'use client'

import { useEffect, useId, useState } from 'react'
import { useFyTour } from '@/lib/fy-tour-context'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import { cn } from '@/lib/utils'

const PADDING = 10
const PET_ANCHOR_X_RATIO = 0.88
const PET_ANCHOR_Y_RATIO = 0.82

function usePetAnchorPixel() {
  const [pt, setPt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const update = () => {
      setPt({
        x: globalThis.innerWidth * PET_ANCHOR_X_RATIO,
        y: globalThis.innerHeight * PET_ANCHOR_Y_RATIO,
      })
    }
    update()
    globalThis.addEventListener('resize', update)
    return () => globalThis.removeEventListener('resize', update)
  }, [])

  return pt
}

function useHighlightRect(anchorId: string | null | undefined, active: boolean) {
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  useEffect(() => {
    if (!active || !anchorId) {
      setRect(null)
      return
    }

    const measure = () => {
      const el = document.querySelector(`[data-fy-anchor="${anchorId}"]`)
      if (!el || !(el instanceof HTMLElement)) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({
        x: r.left - PADDING,
        y: r.top - PADDING,
        w: r.width + PADDING * 2,
        h: r.height + PADDING * 2,
      })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.documentElement)
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)

    const id = window.requestAnimationFrame(measure)
    const id2 = window.setTimeout(measure, 320)

    return () => {
      cancelAnimationFrame(id)
      window.clearTimeout(id2)
      ro.disconnect()
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [anchorId, active])

  return rect
}

function FyEntranceLayer() {
  const prefersReducedMotion = usePrefersReducedMotion()
  if (prefersReducedMotion) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-[45] flex items-center justify-center bg-sky-500/10 backdrop-blur-[2px]"
        aria-hidden
      />
    )
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[45] overflow-hidden bg-gradient-to-b from-sky-400/25 via-transparent to-blue-600/20"
      aria-hidden
    >
      <div className="fy-entrance-orb absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="fy-entrance-orb-delayed absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-cyan-300/35 blur-2xl" />
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="fy-entrance-particle absolute h-1 w-1 rounded-full bg-white shadow-[0_0_8px_#7dd3fc]"
          style={{
            left: `${12 + (i * 47) % 76}%`,
            top: `${18 + (i * 31) % 55}%`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  )
}

export function FyTourOverlay() {
  const { isTourActive, currentStep, showEntrance, uiMode } = useFyTour()
  const maskId = useId().replace(/:/g, '')
  const prefersReducedMotion = usePrefersReducedMotion()
  const rect = useHighlightRect(currentStep?.anchorId ?? null, isTourActive)
  const { x: petX, y: petY } = usePetAnchorPixel()

  const targetCx = rect ? rect.x + rect.w / 2 : null
  const targetCy = rect ? rect.y + rect.h / 2 : null

  let arrowPath: string | null = null
  if (rect && targetCx !== null && targetCy !== null) {
    const mx = (petX + targetCx) / 2
    const my = (petY + targetCy) / 2 - 40
    arrowPath = `M ${petX} ${petY} Q ${mx} ${my} ${targetCx} ${targetCy}`
  }

  return (
    <>
      {showEntrance ? <FyEntranceLayer /> : null}

      {isTourActive ? (
        <div
          className="pointer-events-none fixed inset-0 z-[40]"
          aria-hidden
        >
          {rect && !prefersReducedMotion ? (
            <svg className="absolute inset-0 h-full w-full" width="100%" height="100%">
              <defs>
                <mask id={maskId}>
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.w}
                    height={rect.h}
                    rx={14}
                    ry={14}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(15, 23, 42, 0.55)" mask={`url(#${maskId})`} />
              {arrowPath ? (
                <path
                  d={arrowPath}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.85)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray="6 8"
                  className={cn(!prefersReducedMotion && 'fy-tour-arrow-dash')}
                />
              ) : null}
              {targetCx !== null && targetCy !== null ? (
                <circle cx={targetCx} cy={targetCy} r={5} fill="rgb(56, 189, 248)" opacity={0.95} />
              ) : null}
            </svg>
          ) : rect && prefersReducedMotion ? (
            <svg className="absolute inset-0 h-full w-full" width="100%" height="100%">
              <defs>
                <mask id={`${maskId}-rm`}>
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.w}
                    height={rect.h}
                    rx={14}
                    ry={14}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(15, 23, 42, 0.5)" mask={`url(#${maskId}-rm)`} />
            </svg>
          ) : (
            <div className="absolute inset-0 bg-slate-900/30" />
          )}
        </div>
      ) : null}

      {uiMode === 'exiting' ? (
        <div
          className="pointer-events-none fixed inset-0 z-[44] bg-gradient-to-t from-sky-500/15 to-transparent animate-out fade-out duration-500"
          aria-hidden
        />
      ) : null}
    </>
  )
}
