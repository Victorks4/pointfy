'use client'

import { useEffect, useRef } from 'react'
import { ensureGsapRegistered } from '@/lib/gsap/register'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

type UseGsapMountOptions = {
  selector?: string
  stagger?: number
  y?: number
  delay?: number
}

/** Entrada suave em filhos (cards, linhas) ao montar a página. */
export function useGsapMount(options: UseGsapMountOptions = {}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const { selector = '[data-gsap-reveal]', stagger = 0.06, y = 14, delay = 0.05 } = options

  useEffect(() => {
    if (prefersReducedMotion) return
    const root = rootRef.current
    if (!root) return

    const gsap = ensureGsapRegistered()
    const targets = root.querySelectorAll(selector)
    if (!targets.length) return

    gsap.fromTo(
      targets,
      { y },
      {
        y: 0,
        duration: 0.45,
        stagger,
        delay,
        ease: 'power3.out',
        clearProps: 'transform',
      },
    )
  }, [prefersReducedMotion, selector, stagger, y, delay])

  return rootRef
}
