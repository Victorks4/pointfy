'use client'

import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatMinutesToDisplay } from '@/lib/time-utils'

export default function AdminJustificativasPage() {
  const { user } = useAuth()
  const { justificativas, usuarios } = useData()

  if (user?.cargo !== 'admin') return null

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Justificativas</h1>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestão de justificativas</CardTitle>
            <CardDescription>
              Tela exclusiva do administrador para visualizar justificativas enviadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {justificativas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma justificativa recebida até o momento.</p>
            ) : (
              justificativas.map((item) => {
                const usuario = usuarios.find((u) => u.id === item.userId)
                return (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{usuario?.nome ?? 'Usuário removido'}</p>
                      <Badge variant={item.tipo === 'atestado' ? 'secondary' : 'default'}>
                        {item.tipo === 'atestado' ? 'Atestado' : 'Compensação'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{formatDate(item.data)}</p>
                    <p className="text-sm mt-2">{item.descricao}</p>
                    {item.tipo === 'compensacao' && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Impacto no banco: {formatMinutesToDisplay(item.minutosAbatidos)}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
