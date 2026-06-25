'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'

export function DashboardDataStatus() {
  const { isDataLoading, dataError, refreshData } = useData()

  if (dataError) {
    return (
      <div
        role="alert"
        className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 md:px-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>{dataError}</span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void refreshData()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (isDataLoading) {
    return (
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground md:px-6">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span>Carregando dados...</span>
      </div>
    )
  }

  return null
}
