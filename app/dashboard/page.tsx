'use client'

import { useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHero, DashboardPageShell } from '@/components/dashboard-page-shell'
import { formatMinutesToDisplay, getTodayString, formatDate, calcularSequenciaAtual } from '@/lib/time-utils'
import { computeProductivityScore } from '@/lib/productivity'
import { Clock, TrendingUp, TrendingDown, Calendar, Bell, AlertCircle, ChevronRight, Zap, Flame, Trophy, Target, CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { LiveClock } from '@/components/live-clock'
import type { DesafioSemanal, PontoRegistro } from '@/lib/types'

function desafioProgressoFromPontos(
  desafio: DesafioSemanal,
  pontosNaSemana: PontoRegistro[],
  progressoArmazenado: number | undefined,
): { progressoCalculado: number; concluido: boolean } {
  if (desafio.tipo === 'custom') {
    const progressoCalculado = progressoArmazenado ?? 0
    return { progressoCalculado, concluido: progressoCalculado >= desafio.meta }
  }

  let progressoCalculado = 0
  if (desafio.tipo === 'meta_horas') {
    const totalMinutos = pontosNaSemana.reduce((acc, p) => acc + p.totalMinutos, 0)
    progressoCalculado = Math.round(totalMinutos / 60)
  } else if (desafio.tipo === 'streak') {
    progressoCalculado = pontosNaSemana.length
  } else if (desafio.tipo === 'pontualidade') {
    progressoCalculado = pontosNaSemana.filter((p) => {
      if (!p.entrada1) return false
      const [h] = p.entrada1.split(':').map(Number)
      return h < 9 || (h === 9 && p.entrada1 === '09:00')
    }).length
  }

  return { progressoCalculado, concluido: progressoCalculado >= desafio.meta }
}

function DesafiosSemanaCard() {
  const { user } = useAuth()
  const { desafios, pontos, getProgressoDesafio, atualizarProgressoDesafio } = useData()

  const desafiosAtivos = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return desafios.filter((d) => {
      if (!d.ativo) return false
      const inicio = new Date(`${d.dataInicio}T00:00:00`)
      const fim = new Date(`${d.dataFim}T23:59:59`)
      return today >= inicio && today <= fim
    })
  }, [desafios])

  const pontosUser = useMemo(
    () => (user ? pontos.filter((p) => p.userId === user.id) : []),
    [user, pontos],
  )

  const desafiosComProgresso = useMemo(() => {
    if (!user) return []
    return desafiosAtivos.map((desafio) => {
      const pontosNaSemana = pontosUser.filter(
        (p) => p.data >= desafio.dataInicio && p.data <= desafio.dataFim,
      )
      const stored = getProgressoDesafio(user.id, desafio.id)?.progressoAtual
      const { progressoCalculado, concluido } = desafioProgressoFromPontos(
        desafio,
        pontosNaSemana,
        stored,
      )
      const percentual = desafio.meta > 0 ? Math.min((progressoCalculado / desafio.meta) * 100, 100) : 0
      return { ...desafio, progressoCalculado, percentual, concluido }
    })
  }, [user, desafiosAtivos, pontosUser, getProgressoDesafio])

  useEffect(() => {
    if (!user) return
    for (const desafio of desafiosAtivos) {
      if (desafio.tipo === 'custom') continue
      const pontosNaSemana = pontosUser.filter(
        (p) => p.data >= desafio.dataInicio && p.data <= desafio.dataFim,
      )
      const { progressoCalculado, concluido } = desafioProgressoFromPontos(desafio, pontosNaSemana, undefined)
      atualizarProgressoDesafio(user.id, desafio.id, progressoCalculado, concluido)
    }
  }, [user, desafiosAtivos, pontosUser, atualizarProgressoDesafio])

  return (
    <Card className="neon-card border-border transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-600" />
          Desafios da Semana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {desafiosComProgresso.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Nenhum desafio ativo esta semana.</p>
        ) : (
          desafiosComProgresso.map(desafio => (
            <div
              key={desafio.id}
              className="flex flex-col gap-1 rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{desafio.titulo}</span>
                {desafio.concluido && <CircleCheck className="h-4 w-4 text-green-600" />}
              </div>
              <Progress
                value={desafio.percentual}
                className="h-1.5 bg-zinc-200 [&>div]:bg-indigo-500"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{desafio.progressoCalculado}/{desafio.meta}</span>
                {desafio.recompensa && <span>{desafio.recompensa}</span>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { getPontosByUser, getBancoHoras, getNotificacoesByUser, getPontoByDate, getActivePontoConfig } = useData()
  const router = useRouter()
  useEffect(() => {
    if (user?.cargo === 'admin') {
      router.replace('/dashboard/admin')
      return
    }
    if (user?.cargo === 'gestor') {
      router.replace('/dashboard/gestor')
    }
  }, [router, user?.cargo])

  if (user?.cargo === 'admin' || user?.cargo === 'gestor') {
    return null
  }

  const pontos = user ? getPontosByUser(user.id) : []
  const bancoHoras = user ? getBancoHoras(user.id) : 0
  const notificacoes = user ? getNotificacoesByUser(user.id).filter(n => !n.lida) : []
  const pontoHoje = user ? getPontoByDate(user.id, getTodayString()) : null

  const totalHorasMes = pontos.reduce((acc, p) => acc + p.totalMinutos, 0)
  
  const activeConfig = getActivePontoConfig()
  const metaDiaria = activeConfig.metaDiariaMinutos
  const progressoDia = pontoHoje ? Math.min((pontoHoje.totalMinutos / metaDiaria) * 100, 100) : 0
  const streakAtual = calcularSequenciaAtual(pontos.map(p => p.data))
  const productivity = computeProductivityScore(pontos, streakAtual, metaDiaria)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <DashboardPageShell>
        <DashboardPageHero
          anchorId="fy-dashboard-hero"
          title={
            <h1 className="neon-text-glow flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <Zap className="neon-zap-icon h-5 w-5 shrink-0 text-primary" aria-hidden />
              {getGreeting()}, {user?.nome?.split(' ')[0]}!
            </h1>
          }
          description={
            <p className="text-sm md:text-base">
              {formatDate(getTodayString())} — Vamos acompanhar seu dia
            </p>
          }
          trailing={
            <LiveClock className="neon-clock flex items-center gap-2 text-sm tabular-nums" />
          }
        />

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card data-gsap-reveal className="neon-card neon-card-presence group border-border bg-card transition-all duration-300 dark:border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Presença hoje</CardTitle>
              <div className="p-2 rounded-lg bg-muted group-hover:bg-accent transition-colors">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {pontoHoje ? (
                <>
                  <div className="text-2xl font-bold text-card-foreground">
                    {formatMinutesToDisplay(pontoHoje.totalMinutos)}
                  </div>
                  <Progress value={progressoDia} className="neon-progress mt-2 h-2 bg-zinc-200 [&>div]:bg-primary" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progressoDia.toFixed(0)}% da meta diária
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-muted-foreground">--:--</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Aguardando registro
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card
            data-gsap-reveal
            className={`neon-card group border-border bg-card transition-all duration-300 dark:border-border ${bancoHoras >= 0 ? 'neon-metric-positive' : 'neon-metric-negative'}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Saldo</CardTitle>
              <div
                className={`rounded-lg p-2 transition-colors ${bancoHoras >= 0 ? 'bg-green-100 group-hover:bg-green-200 dark:bg-green-500/15 dark:group-hover:bg-green-500/25' : 'bg-red-100 group-hover:bg-red-200 dark:bg-red-500/15 dark:group-hover:bg-red-500/25'}`}
              >
                {bancoHoras >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${bancoHoras >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {formatMinutesToDisplay(bancoHoras)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {bancoHoras >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
              </p>
            </CardContent>
          </Card>

          <Card data-gsap-reveal className="neon-card group border-border bg-card transition-all duration-300 dark:border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Horas no Mês</CardTitle>
              <div className="p-2 rounded-lg bg-muted group-hover:bg-accent transition-colors">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">
                {formatMinutesToDisplay(totalHorasMes)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {pontos.length} dias trabalhados
              </p>
            </CardContent>
          </Card>

          <Card data-gsap-reveal className="neon-card group border-border bg-card transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Notificações</CardTitle>
              <div className={`p-2 rounded-lg transition-colors ${notificacoes.length > 0 ? 'bg-muted group-hover:bg-accent' : 'bg-muted'}`}>
                <Bell className={`h-4 w-4 ${notificacoes.length > 0 ? 'text-muted-foreground animate-bounce' : 'text-muted-foreground'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">
                {notificacoes.length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {notificacoes.length > 0 ? 'Novas mensagens' : 'Tudo em dia'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card
            data-fy-anchor="fy-streak"
            data-gsap-reveal
            className="neon-card neon-card-streak border-border bg-card transition-all"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500 drop-shadow-[0_0_6px_var(--neon-glow-orange)]" />
                Sequência Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-card-foreground">{streakAtual} dia(s)</p>
              <p className="text-xs text-muted-foreground mt-1">Mantenha consistência para subir no ranking.</p>
            </CardContent>
          </Card>

          <Card data-gsap-reveal className="neon-card border-border bg-card transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500 drop-shadow-[0_0_6px_var(--neon-glow-orange)]" />
                Nível: {productivity.tier.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-card-foreground">{productivity.score}%</p>
                {productivity.nextTier && (
                  <span className="text-xs text-muted-foreground">
                    próx: {productivity.nextTier.minScore}%
                  </span>
                )}
              </div>
              <Progress
                value={productivity.score}
                className="neon-progress neon-progress-amber mt-2 h-2 bg-zinc-200 [&>div]:bg-amber-500"
              />
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Flame className="h-3 w-3" /> Consistência
                  </span>
                  <span className="font-medium text-muted-foreground">{productivity.breakdown.consistency}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" /> Meta diária
                  </span>
                  <span className="font-medium text-muted-foreground">{productivity.breakdown.goalCompletion}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Pontualidade
                  </span>
                  <span className="font-medium text-muted-foreground">{productivity.breakdown.punctuality}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <DesafiosSemanaCard />
        </div>

        {/* Ações Rápidas */}
        <div data-fy-anchor="fy-dashboard-actions" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            data-gsap-reveal
            className="neon-card-cta group border bg-card shadow-sm transition-all duration-300"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="neon-icon-glow rounded-xl bg-primary p-3 text-primary-foreground transition-transform group-hover:scale-110">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Registrar Presença</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Registre sua entrada e saída
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="neon-btn-primary w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/dashboard/ponto" className="flex items-center justify-center gap-2">
                  Registrar Agora
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="neon-card group border-border bg-card transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-muted p-3 text-muted-foreground transition-colors group-hover:bg-accent">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-card-foreground">Justificativas</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Atestados e compensações
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="neon-btn-outline w-full border-border text-foreground hover:bg-muted">
                <Link href="/dashboard/justificativas" className="flex items-center justify-center gap-2">
                  Ver Justificativas
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="neon-card group border-border bg-card transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-muted p-3 text-muted-foreground transition-colors group-hover:bg-accent">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-card-foreground">Histórico</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Registros anteriores
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="neon-btn-outline w-full border-border text-foreground hover:bg-muted">
                <Link href="/dashboard/historico" className="flex items-center justify-center gap-2">
                  Ver Histórico
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Últimos Registros */}
        {pontos.length > 0 && (
          <Card data-gsap-reveal className="mt-6 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Últimos Registros</CardTitle>
              <CardDescription className="text-muted-foreground">
                Seus 5 últimos registros de presença
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pontos.slice(0, 5).map((ponto, index) => (
                  <div
                    key={ponto.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted hover:bg-accent transition-colors"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div>
                      <p className="font-medium text-sm text-card-foreground">
                        {formatDate(ponto.data)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ponto.entrada1 || '--:--'} - {ponto.saida1 || '--:--'}
                        {ponto.entrada2 && ` | ${ponto.entrada2} - ${ponto.saida2 || '--:--'}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-card-foreground">
                        {formatMinutesToDisplay(ponto.totalMinutos)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </DashboardPageShell>
  )
}
