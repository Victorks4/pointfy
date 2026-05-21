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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

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
      <SidebarInset>
        <FyTourProvider>
          <div className="flex flex-1 flex-col pb-24 md:pb-10">{children}</div>
          <FyTourOverlay />
          <FyGuide />
        </FyTourProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
