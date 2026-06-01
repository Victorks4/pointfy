'use client'

import { gsap } from 'gsap'

let registered = false

export function ensureGsapRegistered() {
  if (registered || typeof window === 'undefined') return gsap
  registered = true
  gsap.defaults({ ease: 'power2.out', duration: 0.45 })
  return gsap
}

export { gsap }
