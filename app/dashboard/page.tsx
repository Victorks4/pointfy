'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { formatMinutesToDisplay, getTodayString, formatDate } from '@/lib/time-utils'
import { Clock, TrendingUp, TrendingDown, Calendar, Bell, AlertCircle, ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export default function DashboardPage() {
  const { user } = useAuth()
  const { getPontosByUser, getBancoHoras, getNotificacoesByUser, getPontoByDate } = useData()
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pontos = user ? getPontosByUser(user.id) : []
  const bancoHoras = user ? getBancoHoras(user.id) : 0
  const notificacoes = user ? getNotificacoesByUser(user.id).filter(n => !n.lida) : []
  const pontoHoje = user ? getPontoByDate(user.id, getTodayString()) : null

  const totalHorasMes = pontos.reduce((acc, p) => acc + p.totalMinutos, 0)
  
  // Calcular progresso do dia (6h = 360min é a meta)
  const metaDiaria = 360
  const progressoDia = pontoHoje ? Math.min((pontoHoje.totalMinutos / metaDiaria) * 100, 100) : 0

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
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-blue-100 bg-white/80 backdrop-blur-sm px-4 sticky top-0 z-10">
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

      <main className="flex-1 p-4 md:p-6 bg-blue-50/50">
        {/* Header com saudação */}
        <div className={`mb-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
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
          <Card className={`group hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-white border-blue-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Ponto Hoje</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {pontoHoje ? (
                <>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatMinutesToDisplay(pontoHoje.totalMinutos)}
                  </div>
                  <Progress value={progressoDia} className="mt-2 h-2 bg-blue-100 [&>div]:bg-blue-500" />
                  <p className="text-xs text-blue-600/70 mt-1">
                    {progressoDia.toFixed(0)}% da meta diária
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-300">--:--</div>
                  <p className="text-xs text-blue-600/70 mt-2">
                    Aguardando registro
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className={`group hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-white border-blue-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Banco de Horas</CardTitle>
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
              <p className="text-xs text-blue-600/70 mt-2">
                {bancoHoras >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
              </p>
            </CardContent>
          </Card>

          <Card className={`group hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-white border-blue-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Horas no Mês</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {formatMinutesToDisplay(totalHorasMes)}
              </div>
              <p className="text-xs text-blue-600/70 mt-2">
                {pontos.length} dias trabalhados
              </p>
            </CardContent>
          </Card>

          <Card className={`group hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-white border-blue-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '400ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Notificações</CardTitle>
              <div className={`p-2 rounded-lg transition-colors ${notificacoes.length > 0 ? 'bg-blue-100 group-hover:bg-blue-200' : 'bg-blue-50'}`}>
                <Bell className={`h-4 w-4 ${notificacoes.length > 0 ? 'text-blue-600 animate-bounce' : 'text-blue-400'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {notificacoes.length}
              </div>
              <p className="text-xs text-blue-600/70 mt-2">
                {notificacoes.length > 0 ? 'Novas mensagens' : 'Tudo em dia'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '500ms' }}>
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

          <Card className="group hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-white border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-blue-900">Justificativas</CardTitle>
                  <CardDescription className="text-blue-600/70">
                    Atestados e compensações
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full group-hover:border-blue-400 transition-all border-blue-200 text-blue-700 hover:bg-blue-50">
                <Link href="/dashboard/justificativas" className="flex items-center justify-center gap-2">
                  Ver Justificativas
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-white border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-blue-900">Histórico</CardTitle>
                  <CardDescription className="text-blue-600/70">
                    Registros anteriores
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full group-hover:border-blue-400 transition-all border-blue-200 text-blue-700 hover:bg-blue-50">
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
          <Card className={`mt-6 transition-all duration-500 bg-white border-blue-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '600ms' }}>
            <CardHeader>
              <CardTitle className="text-blue-900">Últimos Registros</CardTitle>
              <CardDescription className="text-blue-600/70">
                Seus 5 últimos registros de ponto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pontos.slice(0, 5).map((ponto, index) => (
                  <div
                    key={ponto.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div>
                      <p className="font-medium text-sm text-blue-900">
                        {formatDate(ponto.data)}
                      </p>
                      <p className="text-xs text-blue-600/70">
                        {ponto.entrada1 || '--:--'} - {ponto.saida1 || '--:--'}
                        {ponto.entrada2 && ` | ${ponto.entrada2} - ${ponto.saida2 || '--:--'}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-900">
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
