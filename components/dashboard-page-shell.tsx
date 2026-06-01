'use client'

import type { ReactNode } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type DashboardPageShellProps = {
  children: ReactNode
  className?: string
}

/**
 * Área de conteúdo do dashboard com scroll próprio e espaço reservado à sidebar (modo ícone).
 */
export function DashboardPageShell({ children, className }: DashboardPageShellProps) {
  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <div className="neon-ambient min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {children}
      </div>
    </div>
  )
}

type DashboardPageHeroProps = {
  title: ReactNode
  description?: ReactNode
  trailing?: ReactNode
  anchorId?: string
}

export function DashboardPageHero({ title, description, trailing, anchorId }: DashboardPageHeroProps) {
  return (
    <header
      data-fy-anchor={anchorId}
      className="neon-hero mb-6 border-b border-border pb-4"
    >
      <div className="flex items-start gap-2">
        <SidebarTrigger className="-ml-1 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">{title}</div>
            {trailing ? <div className="shrink-0">{trailing}</div> : null}
          </div>
          {description ? <div className="text-muted-foreground">{description}</div> : null}
        </div>
      </div>
    </header>
  )
}
