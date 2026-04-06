'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { FyGuide } from '@/components/fy-guide'
import { FyProvider } from '@/lib/fy-context'
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
      <FyProvider userId={user.id} isAdmin={user.cargo === 'admin'}>
        <DashboardSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col pb-24 md:pb-10">
            {children}
          </div>
          <FyGuide />
        </SidebarInset>
      </FyProvider>
    </SidebarProvider>
  )
}
