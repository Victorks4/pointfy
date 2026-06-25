'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold">Algo deu errado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Ocorreu um erro inesperado. Tente novamente ou volte ao início.
      </p>
      <div className="flex gap-3">
        <Button type="button" onClick={reset}>
          Tentar novamente
        </Button>
        <Button type="button" variant="outline" onClick={() => window.location.assign('/')}>
          Ir para o login
        </Button>
      </div>
    </div>
  )
}
