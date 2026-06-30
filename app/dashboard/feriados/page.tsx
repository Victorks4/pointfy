'use client'

import { useEffect, useMemo, useState } from 'react'
import { listFeriadosAction } from '@/app/actions/feriados'
import { FeriadosCalendarView } from '@/components/feriados-calendar-view'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatDate } from '@/lib/time-utils'
import type { Feriado, FeriadoTipo } from '@/lib/types'

const TIPO_LABELS: Record<FeriadoTipo, string> = {
  nacional: 'Nacional',
  municipal: 'Municipal',
  empresa: 'Empresa',
}

export default function FeriadosEstagiarioPage() {
  const { user } = useAuth()
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [loading, setLoading] = useState(true)

  const recessos = useMemo(() => {
    if (!user) return []
    const periodos = []
    if (user.dataInicioRecesso1 && user.dataFimRecesso1) {
      periodos.push({
        numero: 1 as const,
        inicio: user.dataInicioRecesso1,
        fim: user.dataFimRecesso1,
      })
    }
    if (user.dataInicioRecesso2 && user.dataFimRecesso2) {
      periodos.push({
        numero: 2 as const,
        inicio: user.dataInicioRecesso2,
        fim: user.dataFimRecesso2,
      })
    }
    return periodos
  }, [user])
  useEffect(() => {
    void listFeriadosAction().then((result) => {
      setLoading(false)
      if (result.success) setFeriados(result.data)
      else toast.error(result.error)
    })
  }, [])

  const ordenados = useMemo(
    () => [...feriados].sort((a, b) => a.data.localeCompare(b.data)),
    [feriados],
  )

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Feriados</h1>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Calendário de feriados</h2>
          <p className="text-muted-foreground">
            Consulte os feriados nacionais e os cadastrados pela administração
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
            <CardDescription>
              Dias em destaque são feriados — não é necessário registrar ponto nessas datas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando calendário...</p>
            ) : (
              <FeriadosCalendarView feriados={feriados} recessos={recessos} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Todos os feriados</CardTitle>
            <CardDescription>Lista completa disponível para consulta</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : ordenados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum feriado cadastrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordenados.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{formatDate(f.data)}</TableCell>
                        <TableCell>{f.nome}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{TIPO_LABELS[f.tipo]}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
