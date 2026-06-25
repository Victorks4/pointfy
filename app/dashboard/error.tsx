'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold">Erro no dashboard</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || 'Não foi possível carregar esta página.'}
      </p>
      <Button type="button" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  )
}
