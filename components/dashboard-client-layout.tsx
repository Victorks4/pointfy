'use client'

import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-context'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { DashboardProviders } from '@/components/dashboard-providers'
import { FyTourProvider } from '@/lib/fy-tour-context'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import type { User } from '@/lib/types'

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

function DashboardProfileError({
  message,
  onRetry,
  onLogout,
}: {
  message: string
  onRetry: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex justify-center gap-3">
          <Button type="button" onClick={onRetry}>
            Tentar novamente
          </Button>
          <Button type="button" variant="outline" onClick={onLogout}>
            Sair
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DashboardClientLayout({
  initialUser,
  children,
}: {
  initialUser: User
  children: React.ReactNode
}) {
  const { user: authUser, profileError, retryProfileLoad, logout } = useAuth()
  const user = authUser ?? initialUser

  if (profileError && !user) {
    return (
      <DashboardProfileError
        message={profileError}
        onRetry={() => void retryProfileLoad()}
        onLogout={() => void logout()}
      />
    )
  }

  if (!user) {
    return <DashboardLoadingShell />
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
