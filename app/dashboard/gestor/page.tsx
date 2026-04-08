'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  formatDate,
  formatMinutesToDisplay,
  getTodayString,
  calcularSequenciaAtual,
} from '@/lib/time-utils'
import { Calendar, Clock, FileText, Bell, User, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GestorFolhaPontoCard } from '@/components/folha-ponto-assinatura-cards'

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

type AtividadeItem = {
  id: string
  tipo: 'notificacao' | 'ponto'
  titulo: string
  detalhe: string
  dataRef: string
}

export default function GestorDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const {
    getEstagiariosDoGestor,
    getPontosByUser,
    getJustificativasByUser,
    getNotificacoesByUser,
    getBancoHoras,
    getPontoByDate,
    getActivePontoConfig,
  } = useData()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(() =>
    String(new Date().getMonth() + 1).padStart(2, '0'),
  )
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()))

  useEffect(() => {
    if (user && user.cargo !== 'gestor') {
      router.replace('/dashboard')
    }
  }, [user, router])

  const vinculados = user ? getEstagiariosDoGestor(user.id) : []

  useEffect(() => {
    if (vinculados.length === 0) {
      setSelectedId(null)
      return
    }
    setSelectedId((current) => {
      if (current && vinculados.some((e) => e.id === current)) return current
      return vinculados[0].id
    })
  }, [vinculados])

  const selected = useMemo(
    () => vinculados.find((e) => e.id === selectedId) ?? null,
    [vinculados, selectedId],
  )

  const activeConfig = getActivePontoConfig()
  const pontos = selected ? getPontosByUser(selected.id) : []
  const justificativas = selected ? getJustificativasByUser(selected.id) : []
  const notificacoes = selected ? getNotificacoesByUser(selected.id) : []
  const bancoHoras = selected ? getBancoHoras(selected.id) : 0
  const pontoHoje = selected ? getPontoByDate(selected.id, getTodayString()) : null
  const streakAtual = calcularSequenciaAtual(pontos.map((p) => p.data))
  const naoLidas = notificacoes.filter((n) => !n.lida).length

  const pontosFiltradosMes = useMemo(() => {
    return pontos.filter((p) => {
      const [ano, mes] = p.data.split('-')
      return ano === selectedYear && mes === selectedMonth
    })
  }, [pontos, selectedYear, selectedMonth])

  const totalMes = pontosFiltradosMes.reduce((acc, p) => acc + p.totalMinutos, 0)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))

  const atividades = useMemo((): AtividadeItem[] => {
    if (!selected) return []
    const fromNotif: AtividadeItem[] = notificacoes.map((n) => ({
      id: `n-${n.id}`,
      tipo: 'notificacao',
      titulo: n.titulo,
      detalhe: n.mensagem,
      dataRef: n.createdAt,
    }))
    const fromPontos: AtividadeItem[] = pontos.slice(0, 12).map((p) => ({
      id: `p-${p.id}`,
      tipo: 'ponto',
      titulo: `Registro de ponto — ${formatDate(p.data)}`,
      detalhe: `Total ${formatMinutesToDisplay(p.totalMinutos)}`,
      dataRef: p.updatedAt ?? p.createdAt ?? p.data,
    }))
    return [...fromNotif, ...fromPontos].sort(
      (a, b) => new Date(b.dataRef).getTime() - new Date(a.dataRef).getTime(),
    )
  }, [selected, notificacoes, pontos])

  if (!user || user.cargo !== 'gestor') {
    return null
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Meus estagiários</h1>
      </header>

      <main
        data-fy-anchor="fy-gestor-panel"
        className="flex flex-1 flex-col gap-4 p-4 md:flex-row md:p-6 md:gap-6"
      >
        <Card className="md:w-72 shrink-0 border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Vinculados a você
            </CardTitle>
            <CardDescription>Selecione um estagiário para acompanhar</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {vinculados.length === 0 ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nenhum estagiário vinculado. Peça ao administrador para associar estagiários ao seu perfil em
                Usuários.
              </p>
            ) : (
              <ScrollArea className="h-[min(60vh,28rem)] pr-3">
                <ul className="flex flex-col gap-1">
                  {vinculados.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        className={cn(
                          'w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                          selectedId === e.id
                            ? 'border-primary bg-primary/5 text-foreground'
                            : 'border-transparent bg-muted/40 hover:bg-muted/70 text-foreground',
                        )}
                      >
                        <span className="font-medium block truncate">{e.nome}</span>
                        <span className="text-xs text-muted-foreground truncate block">{e.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="flex-1 min-w-0 space-y-4">
          {!selected ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                Nada para exibir sem estagiários vinculados.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{selected.nome}</h2>
                  <p className="text-muted-foreground text-sm">
                    {selected.departamento} · {formatMinutesToDisplay(selected.cargaHorariaSemanal)}/sem
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/historico?userId=${selected.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Histórico em tela cheia
                  </Link>
                </Button>
              </div>

              {user ? <GestorFolhaPontoCard gestor={user} estagiario={selected} /> : null}

              <Tabs defaultValue="resumo" className="w-full">
                <TabsList className="flex w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
                  <TabsTrigger value="resumo" className="flex-1 min-w-[5.5rem]">
                    Resumo
                  </TabsTrigger>
                  <TabsTrigger value="pontos" className="flex-1 min-w-[5.5rem]">
                    Pontos
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="flex-1 min-w-[5.5rem]">
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="justificativas" className="flex-1 min-w-[6rem]">
                    Justificativas
                  </TabsTrigger>
                  <TabsTrigger value="atividades" className="flex-1 min-w-[6rem]">
                    Atividades
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="resumo" className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Ponto hoje
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {pontoHoje ? (
                          <p className="text-lg font-semibold">
                            {formatMinutesToDisplay(pontoHoje.totalMinutos)}
                          </p>
                        ) : (
                          <Badge variant="secondary">Sem registro</Badge>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Sequência
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-semibold">{streakAtual} dias</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          {bancoHoras >= 0 ? (
                            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                          )}
                          Banco de horas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p
                          className={cn(
                            'text-lg font-semibold',
                            bancoHoras >= 0 ? 'text-green-600' : 'text-destructive',
                          )}
                        >
                          {formatMinutesToDisplay(bancoHoras)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Bell className="h-3.5 w-3.5" />
                          Notificações
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-semibold">{naoLidas} não lidas</p>
                        <p className="text-xs text-muted-foreground">{notificacoes.length} no total</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Últimos registros</CardTitle>
                      <CardDescription>Os cinco dias mais recentes com ponto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pontos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pontos.slice(0, 5).map((p) => (
                              <TableRow key={p.id}>
                                <TableCell>{formatDate(p.data)}</TableCell>
                                <TableCell className="font-medium">
                                  {formatMinutesToDisplay(p.totalMinutos)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pontos" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Todos os registros de ponto</CardTitle>
                      <CardDescription>Ordem do mais recente ao mais antigo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pontos.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">Sem registros.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>E1</TableHead>
                                <TableHead>S1</TableHead>
                                <TableHead>E2</TableHead>
                                <TableHead>S2</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pontos.map((p) => (
                                <TableRow key={p.id}>
                                  <TableCell className="font-medium whitespace-nowrap">
                                    {formatDate(p.data)}
                                  </TableCell>
                                  <TableCell>{p.entrada1 ?? '—'}</TableCell>
                                  <TableCell>{p.saida1 ?? '—'}</TableCell>
                                  <TableCell>{p.entrada2 ?? '—'}</TableCell>
                                  <TableCell>{p.saida2 ?? '—'}</TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {formatMinutesToDisplay(p.totalMinutos)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="historico" className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Período</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {MESES.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger className="w-[88px]">
                            <SelectValue placeholder="Ano" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total do mês</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">{formatMinutesToDisplay(totalMes)}</p>
                        <p className="text-xs text-muted-foreground">
                          {pontosFiltradosMes.length} dias com registro
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Banco (atual)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p
                          className={cn(
                            'text-xl font-bold',
                            bancoHoras >= 0 ? 'text-green-600' : 'text-destructive',
                          )}
                        >
                          {formatMinutesToDisplay(bancoHoras)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Detalhe do período</CardTitle>
                      <CardDescription>
                        {MESES.find((m) => m.value === selectedMonth)?.label} de {selectedYear}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pontosFiltradosMes.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nenhum registro neste período.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>E1</TableHead>
                                <TableHead>S1</TableHead>
                                <TableHead>E2</TableHead>
                                <TableHead>S2</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Obs.</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pontosFiltradosMes.map((ponto) => (
                                <TableRow key={ponto.id}>
                                  <TableCell className="font-medium whitespace-nowrap">
                                    {formatDate(ponto.data)}
                                  </TableCell>
                                  <TableCell>{ponto.entrada1 || '—'}</TableCell>
                                  <TableCell>{ponto.saida1 || '—'}</TableCell>
                                  <TableCell>{ponto.entrada2 || '—'}</TableCell>
                                  <TableCell>{ponto.saida2 || '—'}</TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {formatMinutesToDisplay(ponto.totalMinutos)}
                                  </TableCell>
                                  <TableCell>
                                    {ponto.totalMinutos > activeConfig.limiteMinutosSemJustificativa &&
                                    ponto.justificativaHoraExtra ? (
                                      <Badge variant="outline" className="text-xs">
                                        {ponto.justificativaHoraExtra}
                                      </Badge>
                                    ) : null}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="justificativas" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Justificativas enviadas
                      </CardTitle>
                      <CardDescription>Atestados e compensações registrados pelo estagiário</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {justificativas.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nenhuma justificativa cadastrada.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {justificativas
                            .slice()
                            .sort(
                              (a, b) =>
                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                            )
                            .map((j) => (
                              <li
                                key={j.id}
                                className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm"
                              >
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <Badge variant="outline">{j.tipo}</Badge>
                                  <span className="text-muted-foreground text-xs">
                                    {formatDate(j.data)} ·{' '}
                                    {new Date(j.createdAt).toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className="text-foreground leading-snug">{j.descricao}</p>
                                {j.tipo === 'compensacao' ? (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Abatido: {formatMinutesToDisplay(j.minutosAbatidos)}
                                  </p>
                                ) : null}
                              </li>
                            ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="atividades" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Linha do tempo</CardTitle>
                      <CardDescription>Notificações e registros recentes do estagiário</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {atividades.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nenhuma atividade recente.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {atividades.slice(0, 25).map((item) => (
                            <li
                              key={item.id}
                              className="flex gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                            >
                              <div
                                className={cn(
                                  'mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-medium',
                                  item.tipo === 'notificacao'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-sky-100 text-sky-900',
                                )}
                              >
                                {item.tipo === 'notificacao' ? 'N' : 'P'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm leading-tight">{item.titulo}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {item.detalhe}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  {new Date(item.dataRef).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </>
  )
}
