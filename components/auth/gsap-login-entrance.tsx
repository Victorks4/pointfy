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

    gsap.set([panel, form], { opacity: 1, x: 0, y: 0 })

    gsap
      .timeline({ defaults: { clearProps: 'transform' } })
      .fromTo(panel, { x: -20 }, { x: 0, duration: 0.55, ease: 'power2.out' })
      .fromTo(form, { y: 14 }, { y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.3')
  }, [prefersReducedMotion])

  return <div ref={ref}>{children}</div>
}
