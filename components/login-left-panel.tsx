'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type LoginLeftPanelProps = {
  mounted: boolean
  children: ReactNode
}

const PARTICLE_SEEDS = [
  { l: 10, t: 18, s: 3, delay: 0, amp: 14 },
  { l: 22, t: 72, s: 4, delay: 0.6, amp: 10 },
  { l: 78, t: 22, s: 3, delay: 1.1, amp: 16 },
  { l: 90, t: 55, s: 5, delay: 0.2, amp: 12 },
  { l: 45, t: 8, s: 2, delay: 1.4, amp: 18 },
  { l: 62, t: 88, s: 4, delay: 0.8, amp: 11 },
  { l: 5, t: 48, s: 3, delay: 1.9, amp: 9 },
  { l: 52, t: 38, s: 2, delay: 0.4, amp: 15 },
] as const

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function LoginLeftPanel({ mounted, children }: LoginLeftPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [pointer, setPointer] = useState({ nx: 0.5, ny: 0.5, hover: false })

  const flushPointer = useCallback((clientX: number, clientY: number) => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    setPointer({
      nx: clamp01((clientX - r.left) / r.width),
      ny: clamp01((clientY - r.top) / r.height),
      hover: true,
    })
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        flushPointer(e.clientX, e.clientY)
      })
    },
    [flushPointer],
  )

  const onPointerLeave = useCallback(() => {
    setPointer({ nx: 0.5, ny: 0.5, hover: false })
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const { nx, ny, hover } = pointer
  const glow = prefersReducedMotion ? 0 : hover ? 1 : 0

  const layerVars = {
    '--login-nx': String(nx),
    '--login-ny': String(ny),
    '--login-glow': String(glow),
  } as CSSProperties

  const parallax = (sx: number, sy: number): CSSProperties =>
    prefersReducedMotion
      ? {}
      : { transform: `translate(${(nx - 0.5) * sx}px, ${(ny - 0.5) * sy}px)` }

  return (
    <div
      ref={rootRef}
      className="login-hero-root group/login relative hidden min-h-dvh w-full shrink-0 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 lg:flex lg:min-h-0 lg:w-1/2 lg:self-stretch"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={layerVars}
    >
      <div
        className="login-hero-aurora pointer-events-none absolute inset-0 opacity-90 transition-opacity duration-500"
        aria-hidden
      />
      <div
        className="login-hero-vignette pointer-events-none absolute inset-0"
        aria-hidden
      />

      <svg
        className="login-hero-mesh pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="login-hero-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity={0} />
            <stop offset="45%" stopColor="white" stopOpacity={0.22} />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g className="login-hero-lines motion-reduce:opacity-40">
          <path
            d="M-20 120 L180 280 L420 140 L780 320"
            stroke="url(#login-hero-line)"
            strokeWidth="1.2"
            className="login-hero-path"
          />
          <path
            d="M40 520 L220 380 L480 620 L760 440 L620 880"
            stroke="url(#login-hero-line)"
            strokeWidth="0.9"
            className="login-hero-path login-hero-path-delayed"
          />
          <path
            d="M120 -30 L320 200 L200 480 L520 720 L380 920"
            stroke="url(#login-hero-line)"
            strokeWidth="0.8"
            className="login-hero-path"
          />
          <path
            d="M600 40 L480 260 L720 380 L560 640"
            stroke="url(#login-hero-line)"
            strokeWidth="0.7"
            className="login-hero-path login-hero-path-delayed"
          />
        </g>
      </svg>

      <div
        className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none"
        style={
          prefersReducedMotion
            ? undefined
            : {
                transform: `translate(${(nx - 0.5) * 10}px, ${(ny - 0.5) * 8}px) scale(${hover ? 1.02 : 1})`,
              }
        }
        aria-hidden
      >
        <div
          className={`absolute -top-10 -left-10 transition-all duration-1000 motion-reduce:transition-none ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
        >
          <div style={parallax(26, 22)}>
            <div className="login-hero-frame login-hero-breathe h-32 w-32 rotate-45 border-2 border-white/20" />
          </div>
        </div>

        <div
          className={`absolute top-1/4 left-10 transition-all duration-1000 delay-200 motion-reduce:transition-none ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
        >
          <div style={parallax(20, 18)}>
            <div className="login-hero-frame login-hero-breathe login-hero-breathe-delayed h-20 w-20 rotate-12 border-2 border-white/30" />
          </div>
        </div>

        <div
          className={`absolute bottom-20 left-20 transition-all duration-1000 delay-400 motion-reduce:transition-none ${mounted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
        >
          <div style={parallax(32, 28)}>
            <div className="login-hero-frame login-hero-breathe h-16 w-16 rotate-45 bg-white/10" />
          </div>
        </div>

        <div
          className={`absolute -bottom-20 left-1/3 transition-all duration-1000 delay-300 motion-reduce:transition-none ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        >
          <div style={parallax(18, 24)}>
            <div className="login-hero-frame login-hero-breathe login-hero-breathe-delayed h-40 w-40 rotate-45 border-2 border-white/15" />
          </div>
        </div>

        <div
          className={`absolute top-1/3 right-10 transition-all duration-1000 delay-500 motion-reduce:transition-none ${mounted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
        >
          <div style={parallax(24, 20)}>
            <div className="login-hero-frame login-hero-breathe h-24 w-24 rounded-full border-2 border-white/20" />
          </div>
        </div>
      </div>

      {PARTICLE_SEEDS.map((p, i) => (
        <div
          key={i}
          className="pointer-events-none absolute motion-reduce:hidden"
          style={{
            left: `${p.l}%`,
            top: `${p.t}%`,
            ...parallax(p.amp, p.amp * 0.85),
            transition: prefersReducedMotion ? undefined : 'transform 0.65s ease-out',
          }}
          aria-hidden
        >
          <div
            className="login-hero-particle login-hero-particle-drift rounded-full bg-white/55 shadow-[0_0_14px_rgba(255,255,255,0.45)]"
            style={{
              width: p.s,
              height: p.s,
              animationDelay: `${p.delay}s`,
            }}
          />
        </div>
      ))}

      <div className="relative z-10 flex min-h-dvh w-full flex-1 flex-col items-center justify-center px-12 text-white lg:min-h-0">
        {children}
      </div>
    </div>
  )
}
