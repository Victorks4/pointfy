'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

export function InactiveAccountGuard({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()

  if (user && user.ativo === false) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-semibold">Conta inativa</h1>
          <p className="text-sm text-muted-foreground">
            Seu acesso ao Pontify foi desativado. Entre em contato com a administração ou seu gestor.
          </p>
          <Button type="button" variant="outline" onClick={() => void logout()}>
            Sair
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
