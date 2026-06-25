'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { DashboardProviders } from '@/components/dashboard-providers'
import { FyTourProvider } from '@/lib/fy-tour-context'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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
