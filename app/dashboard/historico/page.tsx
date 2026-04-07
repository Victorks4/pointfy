'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatMinutesToDisplay } from '@/lib/time-utils'
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react'

const MESES = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

export default function HistoricoPage() {
  const { user } = useAuth()
  const { usuarios, getPontosByUser, getBancoHoras, getActivePontoConfig } = useData()
  const activeConfig = getActivePontoConfig()
  const searchParams = useSearchParams()

  const currentYear = new Date().getFullYear()
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(String(currentYear))

  const requestedUserId = searchParams.get('userId')
  const targetUserId = user?.cargo === 'admin' && requestedUserId ? requestedUserId : user?.id
  const targetUser = targetUserId ? usuarios.find((u) => u.id === targetUserId) : null

  const pontos = targetUserId ? getPontosByUser(targetUserId) : []
  const bancoHoras = targetUserId ? getBancoHoras(targetUserId) : 0

  // Filtrar por mês/ano
  const pontosFiltrados = pontos.filter((p) => {
    const [ano, mes] = p.data.split('-')
    return ano === selectedYear && mes === selectedMonth
  })

  const totalMes = pontosFiltrados.reduce((acc, p) => acc + p.totalMinutos, 0)

  // Gerar anos disponíveis
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Histórico</h1>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div data-fy-anchor="fy-historico-panel" className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Histórico de Pontos {targetUser ? `- ${targetUser.nome}` : ''}
          </h2>
          <p className="text-muted-foreground">
            {user?.cargo === 'admin'
              ? 'Visualização administrativa de registros do estagiário'
              : 'Visualize seus registros anteriores'}
          </p>
        </div>

        {/* Filtros e Resumo */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Filtrar Período</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMinutesToDisplay(totalMes)}
              </div>
              <p className="text-xs text-muted-foreground">
                {pontosFiltrados.length} dias trabalhados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Banco de Horas</CardTitle>
              {bancoHoras >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${bancoHoras >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatMinutesToDisplay(bancoHoras)}
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo acumulado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Registros */}
        <Card>
          <CardHeader>
            <CardTitle>Registros do Período</CardTitle>
            <CardDescription>
              {MESES.find(m => m.value === selectedMonth)?.label} de {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pontosFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Entrada 1</TableHead>
                      <TableHead>Saída 1</TableHead>
                      <TableHead>Entrada 2</TableHead>
                      <TableHead>Saída 2</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pontosFiltrados.map((ponto) => (
                      <TableRow key={ponto.id}>
                        <TableCell className="font-medium">
                          {formatDate(ponto.data)}
                        </TableCell>
                        <TableCell>{ponto.entrada1 || '-'}</TableCell>
                        <TableCell>{ponto.saida1 || '-'}</TableCell>
                        <TableCell>{ponto.entrada2 || '-'}</TableCell>
                        <TableCell>{ponto.saida2 || '-'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatMinutesToDisplay(ponto.totalMinutos)}
                        </TableCell>
                        <TableCell>
                          {ponto.totalMinutos > activeConfig.limiteMinutosSemJustificativa && ponto.justificativaHoraExtra && (
                            <Badge variant="outline" className="text-xs">
                              {ponto.justificativaHoraExtra}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum registro encontrado para este período
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
    </>
  )
}
