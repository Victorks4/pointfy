'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  getTodayString,
  formatDate,
  calculateDayTotal,
  isValidTimeFormat,
  isValidTimeSequence,
  isValidNonOverlapping,
  formatMinutesToDisplay,
  isInRecessPeriod,
} from '@/lib/time-utils'
import { LIMITE_MINUTOS_SEM_JUSTIFICATIVA, JUSTIFICATIVAS_HORA_EXTRA } from '@/lib/types'
import { Clock, AlertCircle, Save, Info, CheckCircle, Timer, Coffee } from 'lucide-react'

export default function PontoPage() {
  const { user } = useAuth()
  const { addPonto, updatePonto, getPontoByDate } = useData()
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const today = getTodayString()
  const pontoHoje = user ? getPontoByDate(user.id, today) : null

  const [entrada1, setEntrada1] = useState(pontoHoje?.entrada1 || '')
  const [saida1, setSaida1] = useState(pontoHoje?.saida1 || '')
  const [entrada2, setEntrada2] = useState(pontoHoje?.entrada2 || '')
  const [saida2, setSaida2] = useState(pontoHoje?.saida2 || '')
  const [justificativa, setJustificativa] = useState(pontoHoje?.justificativaHoraExtra || '')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Verificar se está em período de recesso
  const emRecesso = user && isInRecessPeriod(
    today,
    user.dataInicioRecesso,
    user.dataFimRecesso
  )

  // Atualizar campos quando o ponto do dia mudar
  useEffect(() => {
    if (pontoHoje) {
      setEntrada1(pontoHoje.entrada1 || '')
      setSaida1(pontoHoje.saida1 || '')
      setEntrada2(pontoHoje.entrada2 || '')
      setSaida2(pontoHoje.saida2 || '')
      setJustificativa(pontoHoje.justificativaHoraExtra || '')
    }
  }, [pontoHoje])

  // Calcular total de minutos
  const totalMinutos = calculateDayTotal(
    entrada1 || null,
    saida1 || null,
    entrada2 || null,
    saida2 || null
  )

  // Verificar se precisa de justificativa
  const precisaJustificativa = totalMinutos > LIMITE_MINUTOS_SEM_JUSTIFICATIVA

  // Calcular progresso (meta = 6h = 360min)
  const metaDiaria = 360
  const progresso = Math.min((totalMinutos / metaDiaria) * 100, 100)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    // Validar formato dos horários
    if (entrada1 && !isValidTimeFormat(entrada1)) {
      newErrors.push('Entrada 1: formato inválido (use HH:mm)')
    }
    if (saida1 && !isValidTimeFormat(saida1)) {
      newErrors.push('Saída 1: formato inválido (use HH:mm)')
    }
    if (entrada2 && !isValidTimeFormat(entrada2)) {
      newErrors.push('Entrada 2: formato inválido (use HH:mm)')
    }
    if (saida2 && !isValidTimeFormat(saida2)) {
      newErrors.push('Saída 2: formato inválido (use HH:mm)')
    }

    // Validar sequência
    if (entrada1 && saida1 && !isValidTimeSequence(entrada1, saida1)) {
      newErrors.push('A Saída 1 deve ser após a Entrada 1')
    }
    if (entrada2 && saida2 && !isValidTimeSequence(entrada2, saida2)) {
      newErrors.push('A Saída 2 deve ser após a Entrada 2')
    }

    // Validar não sobreposição
    if (saida1 && entrada2 && !isValidNonOverlapping(saida1, entrada2)) {
      newErrors.push('A Entrada 2 deve ser após a Saída 1')
    }

    // Validar justificativa para hora extra
    if (precisaJustificativa && !justificativa) {
      newErrors.push(`Acima de ${formatMinutesToDisplay(LIMITE_MINUTOS_SEM_JUSTIFICATIVA)} é necessário uma justificativa`)
    }

    // Validar que tem pelo menos entrada e saída 1
    if (!entrada1 || !saida1) {
      newErrors.push('Preencha pelo menos a Entrada 1 e Saída 1')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (emRecesso) {
      toast.error('Você está em período de recesso remunerado')
      return
    }

    if (!validateForm()) {
      toast.error('Corrija os erros antes de salvar')
      return
    }

    if (!user) return

    const pontoData = {
      userId: user.id,
      data: today,
      entrada1: entrada1 || null,
      saida1: saida1 || null,
      entrada2: entrada2 || null,
      saida2: saida2 || null,
      totalMinutos,
      observacao: null,
      justificativaHoraExtra: precisaJustificativa ? justificativa : null,
    }

    if (pontoHoje) {
      updatePonto(pontoHoje.id, pontoData)
      toast.success('Ponto atualizado com sucesso!')
    } else {
      addPonto(pontoData)
      toast.success('Ponto registrado com sucesso!')
    }
  }

  if (emRecesso) {
    return (
      <>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold text-foreground">Registrar Ponto</h1>
        </header>

        <main className="flex-1 p-4 md:p-6 bg-muted/30">
          <div className={`max-w-2xl mx-auto transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Card className="border-2 border-amber-500/30 bg-amber-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-amber-500/10">
                    <Coffee className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Você está de Recesso</h3>
                    <p className="text-muted-foreground">
                      Período de recesso remunerado. Aproveite para descansar!
                    </p>
                    {user?.dataFimRecesso && (
                      <p className="text-sm text-amber-600 mt-1">
                        Retorno em: {formatDate(user.dataFimRecesso)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold text-foreground">Registrar Ponto</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-sm">
            <Timer className="h-4 w-4 text-primary" />
            <span className="font-mono text-primary font-medium">{formatTime(currentTime)}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <div className={`mb-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <h2 className="text-2xl font-bold text-foreground">
              Ponto do Dia
            </h2>
            <p className="text-muted-foreground">
              {formatDate(today)}
            </p>
          </div>

          {/* Card de Total */}
          <Card className={`mb-6 overflow-hidden transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                Total do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-4">
                <div className={`text-4xl font-bold transition-all duration-300 ${totalMinutos > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {formatMinutesToDisplay(totalMinutos)}
                </div>
                <div className="text-sm text-muted-foreground pb-1">
                  / {formatMinutesToDisplay(metaDiaria)} meta
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso da meta</span>
                  <span className="font-medium text-foreground">{progresso.toFixed(0)}%</span>
                </div>
                <Progress value={progresso} className="h-3" />
              </div>

              {precisaJustificativa && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-700">
                    Acima de {formatMinutesToDisplay(LIMITE_MINUTOS_SEM_JUSTIFICATIVA)} - justificativa obrigatória
                  </p>
                </div>
              )}

              {totalMinutos >= metaDiaria && (
                <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-700">
                    Meta diária atingida! Bom trabalho.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulário */}
          <Card className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="text-foreground">Horários</CardTitle>
              <CardDescription>
                Registre seus horários de entrada e saída
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Período 1 */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                    Primeiro Período
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="entrada1" className="text-foreground">Entrada</FieldLabel>
                        <Input
                          id="entrada1"
                          type="time"
                          value={entrada1}
                          onChange={(e) => setEntrada1(e.target.value)}
                          className="text-center font-mono text-lg h-12"
                        />
                      </Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="saida1" className="text-foreground">Saída</FieldLabel>
                        <Input
                          id="saida1"
                          type="time"
                          value={saida1}
                          onChange={(e) => setSaida1(e.target.value)}
                          className="text-center font-mono text-lg h-12"
                        />
                      </Field>
                    </FieldGroup>
                  </div>
                </div>

                {/* Período 2 */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">2</div>
                    Segundo Período
                    <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="entrada2" className="text-foreground">Entrada</FieldLabel>
                        <Input
                          id="entrada2"
                          type="time"
                          value={entrada2}
                          onChange={(e) => setEntrada2(e.target.value)}
                          className="text-center font-mono text-lg h-12"
                        />
                      </Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="saida2" className="text-foreground">Saída</FieldLabel>
                        <Input
                          id="saida2"
                          type="time"
                          value={saida2}
                          onChange={(e) => setSaida2(e.target.value)}
                          className="text-center font-mono text-lg h-12"
                        />
                      </Field>
                    </FieldGroup>
                  </div>
                </div>

                {/* Justificativa para hora extra */}
                {precisaJustificativa && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <Alert className="mb-4 border-amber-300 bg-amber-100/50">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        Você está registrando mais de {formatMinutesToDisplay(LIMITE_MINUTOS_SEM_JUSTIFICATIVA)}.
                        Por favor, selecione uma justificativa.
                      </AlertDescription>
                    </Alert>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="justificativa" className="text-foreground">Justificativa para Hora Extra</FieldLabel>
                        <Select value={justificativa} onValueChange={setJustificativa}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecione uma justificativa" />
                          </SelectTrigger>
                          <SelectContent>
                            {JUSTIFICATIVAS_HORA_EXTRA.map((j) => (
                              <SelectItem key={j} value={j}>
                                {j}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                  </div>
                )}

                {/* Erros */}
                {errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Botão Salvar */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {pontoHoje ? 'Atualizar Ponto' : 'Registrar Ponto'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
