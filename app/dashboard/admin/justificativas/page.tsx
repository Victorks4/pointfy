'use client'

import { useMemo } from 'react'
import { useAuth } from '@/lib/client/auth-context'
import { useData } from '@/lib/client/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatMinutesToDisplay } from '@/lib/domain/ponto/time-utils'
import {
  STATUS_COMPENSACAO_LABELS,
  compensacaoTipoLabel,
  formatAbonoMinutosLabel,
  isAbonoTipo,
  isCompensacaoTipo,
} from '@/lib/domain/ponto/compensacao-utils'
import { AbonoHorasForm } from '@/components/justificativas/abono-horas-form'

export default function AdminJustificativasPage() {
  const { user } = useAuth()
  const { getJustificativasVisiveisRh, usuarios, createAbonoHoras } = useData()

  const justificativas = getJustificativasVisiveisRh()
  const estagiarios = useMemo(
    () => usuarios.filter((u) => u.cargo === 'estagiario' && u.ativo),
    [usuarios],
  )

  if (user?.cargo !== 'admin') return null

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Justificativas</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <AbonoHorasForm estagiarios={estagiarios} onSubmit={createAbonoHoras} />

        <Card data-fy-anchor="fy-admin-justificativas-main">
          <CardHeader>
            <CardTitle>Gestão de justificativas (RH)</CardTitle>
            <CardDescription>
              Atestados, abonos e compensações já aprovadas pelo gestor. Solicitações pendentes ou
              rejeitadas não aparecem aqui.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {justificativas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma justificativa visível até o momento.</p>
            ) : (
              justificativas.map((item) => {
                const usuario = usuarios.find((u) => u.id === item.userId)
                const tipoLabel = isAbonoTipo(item.tipo)
                  ? 'Abono'
                  : item.tipo === 'atestado'
                    ? 'Atestado'
                    : compensacaoTipoLabel(item.tipo)
                return (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{usuario?.nome ?? 'Usuário removido'}</p>
                      <Badge variant={item.tipo === 'atestado' ? 'secondary' : 'default'}>
                        {tipoLabel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{formatDate(item.data)}</p>
                    <p className="text-sm mt-2">{item.descricao}</p>
                    {isAbonoTipo(item.tipo) && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Ajuste: {formatAbonoMinutosLabel(item.minutosAbatidos)}
                      </p>
                    )}
                    {isCompensacaoTipo(item.tipo) && item.statusCompensacao && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Status: {STATUS_COMPENSACAO_LABELS[item.statusCompensacao]}
                      </p>
                    )}
                    {isCompensacaoTipo(item.tipo) && item.minutosAbatidos !== 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Impacto no saldo: {formatMinutesToDisplay(item.minutosAbatidos)}
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
