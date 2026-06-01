'use client'

import type { ReactNode } from 'react'
import { useGsapMount } from '@/hooks/use-gsap-mount'

export function DashboardGsapRoot({ children }: { children: ReactNode }) {
  const ref = useGsapMount({ selector: '[data-gsap-reveal]' })
  return (
    <div ref={ref} className="flex min-h-0 min-w-0 flex-1 flex-col pb-24 md:pb-10">
      {children}
    </div>
  )
}
