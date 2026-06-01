'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { ensureGsapRegistered } from '@/lib/gsap/register'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

export function GsapLoginEntrance({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return
    const gsap = ensureGsapRegistered()
    const panel = ref.current.querySelector('[data-gsap-login-panel]')
    const form = ref.current.querySelector('[data-gsap-login-form]')
    if (!panel || !form) return

    gsap
      .timeline()
      .fromTo(panel, { opacity: 0, x: -28 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' })
      .fromTo(
        form,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' },
        '-=0.35',
      )
  }, [prefersReducedMotion])

  return <div ref={ref}>{children}</div>
}
