'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useServerUser } from '@/components/server-user-provider'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { DashboardProviders } from '@/components/dashboard-providers'
import { FyTourProvider } from '@/lib/fy-tour-context'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

const FyGuide = dynamic(
  () => import('@/components/fy-guide').then((m) => ({ default: m.FyGuide })),
  { ssr: false },
)

const FyTourOverlay = dynamic(
  () => import('@/components/fy-tour-overlay').then((m) => ({ default: m.FyTourOverlay })),
  { ssr: false },
)

const DashboardGsapRoot = dynamic(
  () => import('@/components/dashboard-gsap-root').then((m) => ({ default: m.DashboardGsapRoot })),
  { ssr: false },
)

function DashboardLoadingShell() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}

function DashboardSessionRecover() {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 6000)
    return () => clearTimeout(timer)
  }, [])

  if (!timedOut) {
    return <DashboardLoadingShell />
  }

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          A sessão demorou para carregar. Tente recarregar a página.
        </p>
        <Button type="button" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
      </div>
    </div>
  )
}

export function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const serverUser = useServerUser()
  const { user: authUser, profileError, retryProfileLoad, logout } = useAuth()
  const user = authUser ?? serverUser

  if (profileError && !user) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{profileError}</p>
          <div className="flex justify-center gap-3">
            <Button type="button" onClick={() => void retryProfileLoad()}>
              Tentar novamente
            </Button>
            <Button type="button" variant="outline" onClick={() => void logout()}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <DashboardSessionRecover />
  }

  return (
    <DashboardProviders>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="min-h-0 overflow-hidden">
          <FyTourProvider>
            <DashboardGsapRoot>{children}</DashboardGsapRoot>
            <FyTourOverlay />
            <FyGuide />
          </FyTourProvider>
        </SidebarInset>
      </SidebarProvider>
    </DashboardProviders>
  )
}
