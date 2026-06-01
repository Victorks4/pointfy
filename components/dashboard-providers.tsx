'use client'

import { Suspense, type ReactNode } from 'react'
import { DataProvider } from '@/lib/data-context'
import { Skeleton } from '@/components/ui/skeleton'

function DashboardDataFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto h-10 w-48" />
        <Skeleton className="mx-auto h-4 w-64" />
      </div>
    </div>
  )
}

export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardDataFallback />}>
      <DataProvider>{children}</DataProvider>
    </Suspense>
  )
}
