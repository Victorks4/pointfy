'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { getPontoSettings, setPontoSettings } from '@/lib/ponto-settings'

export default function AdminConfiguracoesPontoPage() {
  const { user } = useAuth()
  const [formatoDecimal, setFormatoDecimal] = useState<'americano' | 'brasileiro'>('americano')
  const [rejeitarMinutosZero, setRejeitarMinutosZero] = useState(true)

  useEffect(() => {
    const settings = getPontoSettings()
    setFormatoDecimal(settings.formatoDecimal)
    setRejeitarMinutosZero(settings.rejeitarMinutosZero)
  }, [])

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault()

    setPontoSettings({
      formatoDecimal,
      rejeitarMinutosZero,
    })

    toast.success('Configurações salvas com sucesso.')
  }

  if (user?.cargo !== 'admin') return null

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Configurações de Ponto</h1>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Regras de registro de ponto</CardTitle>
            <CardDescription>Configure formato decimal e restrições de minutos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSalvar} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="formato-decimal">
                  Formato decimal
                </label>
                <Input
                  id="formato-decimal"
                  value={formatoDecimal}
                  onChange={(e) =>
                    setFormatoDecimal(e.target.value === 'brasileiro' ? 'brasileiro' : 'americano')
                  }
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Checkbox
                  id="rejeitar-minutos-zero"
                  checked={rejeitarMinutosZero}
                  onCheckedChange={(checked) => setRejeitarMinutosZero(Boolean(checked))}
                />
                <label htmlFor="rejeitar-minutos-zero" className="text-sm leading-5">
                  Rejeitar minutos fechados (<span className="font-mono">:00</span>) no registro de ponto
                </label>
              </div>

              <Button type="submit">Salvar configurações</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
