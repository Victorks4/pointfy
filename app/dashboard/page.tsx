'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { formatMinutesToDisplay, getTodayString, formatDate, calcularSequenciaAtual } from '@/lib/time-utils'
import { computeProductivityScore } from '@/lib/productivity'
import { Clock, TrendingUp, TrendingDown, Calendar, Bell, AlertCircle, ChevronRight, Zap, Flame, Trophy, Target, CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
    <Card className="bg-white border-zinc-200 transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-900 flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-600" />
          Desafios da Semana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {desafiosComProgresso.length === 0 ? (
          <p className="text-xs text-zinc-500 py-2">Nenhum desafio ativo esta semana.</p>
        ) : (
          desafiosComProgresso.map(desafio => (
            <div
              key={desafio.id}
              className="flex flex-col gap-1 rounded-md border border-zinc-200 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-800">{desafio.titulo}</span>
                {desafio.concluido && <CircleCheck className="h-4 w-4 text-green-600" />}
              </div>
              <Progress
                value={desafio.percentual}
                className="h-1.5 bg-zinc-200 [&>div]:bg-indigo-500"
              />
              <div className="flex items-center justify-between text-xs text-zinc-500">
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
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    if (user?.cargo === 'admin') {
      router.replace('/dashboard/admin')
      return
    }
    if (user?.cargo === 'gestor') {
      router.replace('/dashboard/gestor')
      return
    }
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white/90 backdrop-blur-sm px-4 sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold text-black">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(currentTime)}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 bg-zinc-50">
        {/* Header com saudação */}
        <div
          data-fy-anchor="fy-dashboard-hero"
          className={`mb-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-gray-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-black">
              {getGreeting()}, {user?.nome?.split(' ')[0]}!
            </h2>
          </div>
          <p className="text-gray-500">
            {formatDate(getTodayString())} - Vamos acompanhar seu dia
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className={`group hover:shadow-lg hover:border-zinc-300 transition-all duration-300 bg-white border-zinc-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-900">Ponto Hoje</CardTitle>
              <div className="p-2 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
                <Clock className="h-4 w-4 text-zinc-700" />
              </div>
            </CardHeader>
            <CardContent>
              {pontoHoje ? (
                <>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatMinutesToDisplay(pontoHoje.totalMinutos)}
                  </div>
                  <Progress value={progressoDia} className="mt-2 h-2 bg-zinc-200 [&>div]:bg-zinc-700" />
                  <p className="text-xs text-zinc-600 mt-1">
                    {progressoDia.toFixed(0)}% da meta diária
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-zinc-400">--:--</div>
                  <p className="text-xs text-zinc-600 mt-2">
                    Aguardando registro
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className={`group hover:shadow-lg hover:border-zinc-300 transition-all duration-300 bg-white border-zinc-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-900">Banco de Horas</CardTitle>
              <div className={`p-2 rounded-lg transition-colors ${bancoHoras >= 0 ? 'bg-green-100 group-hover:bg-green-200' : 'bg-red-100 group-hover:bg-red-200'}`}>
                {bancoHoras >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${bancoHoras >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMinutesToDisplay(bancoHoras)}
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                {bancoHoras >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
              </p>
            </CardContent>
          </Card>

          <Card className={`group hover:shadow-lg hover:border-zinc-300 transition-all duration-300 bg-white border-zinc-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-900">Horas no Mês</CardTitle>
              <div className="p-2 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
                <Calendar className="h-4 w-4 text-zinc-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">
                {formatMinutesToDisplay(totalHorasMes)}
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                {pontos.length} dias trabalhados
              </p>
            </CardContent>
          </Card>

          <Card className={`group hover:shadow-lg hover:border-zinc-300 transition-all duration-300 bg-white border-zinc-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '400ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-900">Notificações</CardTitle>
              <div className={`p-2 rounded-lg transition-colors ${notificacoes.length > 0 ? 'bg-zinc-100 group-hover:bg-zinc-200' : 'bg-zinc-100'}`}>
                <Bell className={`h-4 w-4 ${notificacoes.length > 0 ? 'text-zinc-700 animate-bounce' : 'text-zinc-500'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">
                {notificacoes.length}
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                {notificacoes.length > 0 ? 'Novas mensagens' : 'Tudo em dia'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className={`grid gap-4 md:grid-cols-3 mb-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '450ms' }}>
          <Card
            data-fy-anchor="fy-streak"
            className="bg-white border-zinc-200 hover:shadow-lg transition-all"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Sequência Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-zinc-900">{streakAtual} dia(s)</p>
              <p className="text-xs text-zinc-600 mt-1">Mantenha consistência para subir no ranking.</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Nível: {productivity.tier.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-zinc-900">{productivity.score}%</p>
                {productivity.nextTier && (
                  <span className="text-xs text-zinc-500">
                    próx: {productivity.nextTier.minScore}%
                  </span>
                )}
              </div>
              <Progress
                value={productivity.score}
                className="mt-2 h-2 bg-zinc-200 [&>div]:bg-amber-500"
              />
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Flame className="h-3 w-3" /> Consistência
                  </span>
                  <span className="font-medium text-zinc-700">{productivity.breakdown.consistency}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Target className="h-3 w-3" /> Meta diária
                  </span>
                  <span className="font-medium text-zinc-700">{productivity.breakdown.goalCompletion}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Pontualidade
                  </span>
                  <span className="font-medium text-zinc-700">{productivity.breakdown.punctuality}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <DesafiosSemanaCard />
        </div>

        {/* Ações Rápidas */}
        <div
          data-fy-anchor="fy-dashboard-actions"
          className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '500ms' }}
        >
          <Card className="group hover:shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-blue-900">Registrar Ponto</CardTitle>
                  <CardDescription className="text-blue-600/70">
                    Registre sua entrada e saída
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full group-hover:shadow-md transition-all bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/dashboard/ponto" className="flex items-center justify-center gap-2">
                  Registrar Agora
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:border-zinc-300 transition-all duration-300 bg-white border-zinc-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200 transition-colors">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-zinc-900">Justificativas</CardTitle>
                  <CardDescription className="text-zinc-600">
                    Atestados e compensações
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full group-hover:border-zinc-400 transition-all border-zinc-300 text-zinc-800 hover:bg-zinc-100">
                <Link href="/dashboard/justificativas" className="flex items-center justify-center gap-2">
                  Ver Justificativas
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:border-zinc-300 transition-all duration-300 bg-white border-zinc-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200 transition-colors">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-zinc-900">Histórico</CardTitle>
                  <CardDescription className="text-zinc-600">
                    Registros anteriores
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full group-hover:border-zinc-400 transition-all border-zinc-300 text-zinc-800 hover:bg-zinc-100">
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
          <Card className={`mt-6 transition-all duration-500 bg-white border-zinc-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '600ms' }}>
            <CardHeader>
              <CardTitle className="text-zinc-900">Últimos Registros</CardTitle>
              <CardDescription className="text-zinc-600">
                Seus 5 últimos registros de ponto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pontos.slice(0, 5).map((ponto, index) => (
                  <div
                    key={ponto.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div>
                      <p className="font-medium text-sm text-zinc-900">
                        {formatDate(ponto.data)}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {ponto.entrada1 || '--:--'} - {ponto.saida1 || '--:--'}
                        {ponto.entrada2 && ` | ${ponto.entrada2} - ${ponto.saida2 || '--:--'}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-900">
                        {formatMinutesToDisplay(ponto.totalMinutos)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}
