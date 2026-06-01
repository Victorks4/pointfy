'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { FyTourProvider } from '@/lib/fy-tour-context'

const FyGuide = dynamic(
  () => import('@/components/fy-guide').then((m) => ({ default: m.FyGuide })),
  { ssr: false },
)

const FyTourOverlay = dynamic(
  () => import('@/components/fy-tour-overlay').then((m) => ({ default: m.FyTourOverlay })),
  { ssr: false },
)
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useGsapMount } from '@/hooks/use-gsap-mount'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const gsapRootRef = useGsapMount({ selector: '[data-gsap-reveal]' })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
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
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="min-h-0 overflow-hidden">
        <FyTourProvider>
          <div ref={gsapRootRef} className="flex min-h-0 min-w-0 flex-1 flex-col pb-24 md:pb-10">
            {children}
          </div>
          <FyTourOverlay />
          <FyGuide />
        </FyTourProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
