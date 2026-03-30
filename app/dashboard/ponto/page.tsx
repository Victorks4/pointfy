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
  import { toast } from 'sonner'
  import { getPontoSettings } from '@/lib/ponto-settings'
  import {
    getTodayString,
    formatDate,
    calculateDayTotal,
    isValidTimeFormat,
    isValidTimeSequence,
    isValidNonOverlapping,
    formatMinutesToDisplay,
    isInRecessPeriod,
    splitPercentIntoThreeBands,
    getWaveBandClassByMinutes,
  } from '@/lib/time-utils'
  import { LIMITE_MINUTOS_SEM_JUSTIFICATIVA, JUSTIFICATIVAS_HORA_EXTRA } from '@/lib/types'
  import { Clock, AlertCircle, Save, Info, CheckCircle, Timer, Coffee } from 'lucide-react'

  // ─── Tipos ────────────────────────────────────────────────────────────────────

  type PeriodoFields = {
    entrada1: string
    saida1: string
    entrada2: string
    saida2: string
  }

  // ─── Constantes ───────────────────────────────────────────────────────────────

  const META_DIARIA_MINUTOS = 360

  const REGRAS_PREENCHIMENTO = [
    { icon: AlertCircle, color: 'text-amber-500', texto: 'Formato HH:MM obrigatório' },
    { icon: AlertCircle, color: 'text-amber-500', texto: 'Horários "fechados" (minutos = 00) não são aceitos' },
    { icon: AlertCircle, color: 'text-amber-500', texto: 'Saída deve ser após a entrada' },
    { icon: AlertCircle, color: 'text-amber-500', texto: 'Sem sobreposição de horários' },
    { icon: Info,        color: 'text-sky-500',   texto: `Máximo de ${formatMinutesToDisplay(LIMITE_MINUTOS_SEM_JUSTIFICATIVA)} sem justificativa` },
  ]

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const hasClosedMinutes = (time: string): boolean => {
    const [, min] = time.split(':')
    return Number.isFinite(Number(min)) && Number(min) === 0
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  // ─── Hook de validação ────────────────────────────────────────────────────────

  function useValidatePonto(
    campos: PeriodoFields,
    justificativa: string,
    precisaJustificativa: boolean,
    rejeitarMinutosZero: boolean,
  ) {
    const validate = (): string[] => {
      const { entrada1, saida1, entrada2, saida2 } = campos
      const erros: string[] = []

      // Formato e minutos fechados
      const periodos = [
        { label: 'Entrada 1', value: entrada1 },
        { label: 'Saída 1',   value: saida1 },
        { label: 'Entrada 2', value: entrada2 },
        { label: 'Saída 2',   value: saida2 },
      ]

      for (const { label, value } of periodos) {
        if (!value) continue
        if (!isValidTimeFormat(value))
          erros.push(`${label}: formato inválido (use HH:mm)`)
        if (rejeitarMinutosZero && hasClosedMinutes(value))
          erros.push(`${label}: minutos devem ser diferentes de :00`)
      }

      // Sequência e sobreposição
      const sequencias = [
        { anterior: entrada1, posterior: saida1,   msg: 'A Saída 1 deve ser após a Entrada 1' },
        { anterior: entrada2, posterior: saida2,   msg: 'A Saída 2 deve ser após a Entrada 2' },
        { anterior: saida1,   posterior: entrada2, msg: 'A Entrada 2 deve ser após a Saída 1' },
      ]

      for (const { anterior, posterior, msg } of sequencias) {
        if (anterior && posterior && !isValidTimeSequence(anterior, posterior))
          erros.push(msg)
      }

      if (precisaJustificativa && !justificativa)
        erros.push(`Acima de ${formatMinutesToDisplay(LIMITE_MINUTOS_SEM_JUSTIFICATIVA)} é necessário uma justificativa`)

      if (!entrada1 || !saida1 || !entrada2 || !saida2)
        erros.push('Os campos dos dois períodos são obrigatórios')

      return erros
    }

    return { validate }
  }

  // ─── Hook de progresso visual ─────────────────────────────────────────────────

  function useProgressoVisual(totalMinutos: number) {
    const progresso = Math.min((totalMinutos / META_DIARIA_MINUTOS) * 100, 100)
    const progressoParaExibicao = Math.max(progresso, 4)
    const progressoColorClass = getWaveBandClassByMinutes(totalMinutos, META_DIARIA_MINUTOS)
    

    const barFillPercent = Math.max(progresso, 6)
    const barFillVariantClass =
      progressoColorClass === 'wave-red'    ? 'wave-progress-fill-red'    :
      progressoColorClass === 'wave-yellow' ? 'wave-progress-fill-yellow' :
                                              'wave-progress-fill-blue'

    const [baseRed, baseYellow, baseBlue] = splitPercentIntoThreeBands(progressoParaExibicao)
    const waterHeight = Math.max(progressoParaExibicao - 5, 0)
    const [waterRed, waterYellow, waterBlue] = splitPercentIntoThreeBands(waterHeight)

    return {
      progresso,
      progressoColorClass,
      barFillPercent,
      barFillVariantClass,
      base: { red: baseRed, yellow: baseYellow, blue: baseBlue },
      water: { red: waterRed, yellow: waterYellow, blue: waterBlue },
      baseBottomYellow: baseRed,
      baseBottomBlue: baseRed + baseYellow,
      waterBottomYellow: waterRed,
      waterBottomBlue: waterRed + waterYellow,
    }
  }

  // ─── Sub-componentes ──────────────────────────────────────────────────────────

  function PageHeader({ currentTime }: { currentTime: Date }) {
    return (
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
    )
  }

  function RecessoCard({ dataFimRecesso }: { dataFimRecesso?: string }) {
    return (
      <>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold text-foreground">Registrar Ponto</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-muted/30">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-amber-500/30 bg-amber-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-amber-500/10">
                    <Coffee className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Você está de Recesso</h3>
                    <p className="text-muted-foreground">Período de recesso remunerado. Aproveite para descansar!</p>
                    {dataFimRecesso && (
                      <p className="text-sm text-amber-600 mt-1">Retorno em: {formatDate(dataFimRecesso)}</p>
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

  function CardRegraPreenchimento() {
    return (
      <Card className="border-zinc-200 h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-zinc-900">Regras de Preenchimento</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-base text-[#5f7897]">
            {REGRAS_PREENCHIMENTO.map(({ icon: Icon, color, texto }) => (
              <li key={texto} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                {texto}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    )
  }

  function CardTotalDia({
    totalMinutos,
    precisaJustificativa,
  }: {
    totalMinutos: number
    precisaJustificativa: boolean
  }) {
    const {
      progresso,
      progressoColorClass,
      barFillPercent,
      barFillVariantClass,
      base,
      water,
      baseBottomYellow,
      baseBottomBlue,
      waterBottomYellow,
      waterBottomBlue,
    } = useProgressoVisual(totalMinutos)

    const camadas = [
      { tipo: 'base', cor: 'red',    valor: base.red,    bottom: 0 },
      { tipo: 'base', cor: 'yellow', valor: base.yellow, bottom: baseBottomYellow },
      { tipo: 'base', cor: 'blue',   valor: base.blue,   bottom: baseBottomBlue },
      { tipo: 'water', cor: 'red',   valor: water.red,   bottom: 0 },
      { tipo: 'water', cor: 'yellow',valor: water.yellow,bottom: waterBottomYellow },
      { tipo: 'water', cor: 'blue',  valor: water.blue,  bottom: waterBottomBlue },
    ]

    return (
      <Card className="overflow-hidden h-full">
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
              / {formatMinutesToDisplay(META_DIARIA_MINUTOS)} meta
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
              {/* Barra de progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso da meta</span>
                  <span className="font-medium text-foreground">{progresso.toFixed(0)}%</span>
                </div>
                <div className="wave-progress-track">
                  <div className={`wave-progress-fill ${barFillVariantClass}`} style={{ width: `${barFillPercent}%` }}>
                    <div className="wave-progress-shine" />
                  </div>
                </div>
              </div>

              {/* Relógio circular */}
              <div
                className={`relative mx-auto h-24 w-24 rounded-full border-4 overflow-hidden ${progressoColorClass}`}
                aria-label={`Relógio de progresso diário: ${progresso.toFixed(0)} por cento`}
              >
                <div className="absolute inset-0 rounded-full border-2 wave-ring" />
                <div className="absolute inset-1 rounded-full border-2 wave-ring-delayed" />

                {camadas.map(({ tipo, cor, valor, bottom }) =>
                  valor > 0 ? (
                    <div
                      key={`${tipo}-${cor}`}
                      className={`absolute inset-x-0 wave-water${tipo === 'base' ? '-base' : ''} wave-water${tipo === 'base' ? '-base' : ''}-${cor}`}
                      style={{ height: `${valor}%`, bottom: `${bottom}%` }}
                    />
                  ) : null
                )}

                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold wave-text">
                  {Math.round(progresso)}%
                </div>
              </div>
            </div>
          </div>

          {precisaJustificativa && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">
                Acima de {formatMinutesToDisplay(LIMITE_MINUTOS_SEM_JUSTIFICATIVA)} - justificativa obrigatória
              </p>
            </div>
          )}

          {totalMinutos >= META_DIARIA_MINUTOS && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">Meta diária atingida! Bom trabalho.</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  function PeriodoInput({
    numero,
    entradaId,
    saidaId,
    entradaValue,
    saidaValue,
    onEntradaChange,
    onSaidaChange,
    obrigatorio,
  }: {
    numero: 1 | 2
    entradaId: string
    saidaId: string
    entradaValue: string
    saidaValue: string
    onEntradaChange: (v: string) => void
    onSaidaChange: (v: string) => void
    obrigatorio?: boolean
  }) {
    const isPrimeiro = numero === 1
    return (
      <div className={`p-4 rounded-xl border ${isPrimeiro ? 'bg-muted/50 border-border' : 'bg-muted/30 border-border/50'}`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isPrimeiro ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {numero}
          </div>
          {isPrimeiro ? 'Primeiro Período' : 'Segundo Período'}
          {obrigatorio && <span className="text-xs font-normal text-muted-foreground">(obrigatório)</span>}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: entradaId, label: 'Entrada', value: entradaValue, onChange: onEntradaChange },
            { id: saidaId,   label: 'Saída',   value: saidaValue,   onChange: onSaidaChange },
          ].map(({ id, label, value, onChange }) => (
            <FieldGroup key={id}>
              <Field>
                <FieldLabel htmlFor={id} className="text-foreground">{label}</FieldLabel>
                <Input
                  id={id}
                  type="time"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="text-center font-mono text-lg h-12"
                />
              </Field>
            </FieldGroup>
          ))}
        </div>
      </div>
    )
  }
  function JustificativaAlert({
    justificativa,
    onJustificativaChange,
  }: {
    justificativa: string
    onJustificativaChange: (v: string) => void
  }) {
    // Rastreia qual opção do Select está ativa, independente do valor final
    const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>(() => {
      const isOpcaoFixa = JUSTIFICATIVAS_HORA_EXTRA
        .filter(j => j !== 'Outro')
        .includes(justificativa)
      return isOpcaoFixa ? justificativa : justificativa ? 'Outro' : ''
    })
  
    const isOutro = opcaoSelecionada === 'Outro'
  
    const handleSelectChange = (v: string) => {
      setOpcaoSelecionada(v)
      if (v !== 'Outro') {
        onJustificativaChange(v)   // valor fixo → passa direto ao pai
      } else {
        onJustificativaChange('')  // "Outro" → limpa até o texto ser digitado
      }
    }
  
    const handleOutroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onJustificativaChange(e.target.value)  // texto digitado → passa ao pai
    }
  
    return (
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
        {/* ... Alert igual ... */}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="justificativa">Justificativa para Hora Extra</FieldLabel>
            <Select value={opcaoSelecionada} onValueChange={handleSelectChange}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione uma justificativa" />
              </SelectTrigger>
              <SelectContent>
                {JUSTIFICATIVAS_HORA_EXTRA.map((j) => (
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
  
          {/* Agora renderiza corretamente quando opcaoSelecionada === 'Outro' */}
          {isOutro && (
            <Field>
              <FieldLabel htmlFor="outro-motivo">Descreva o motivo</FieldLabel>
              <Input
                id="outro-motivo"
                value={justificativa}         // ← valor vem do pai (fonte única de verdade)
                onChange={handleOutroChange}
                placeholder="Descreva o motivo da hora extra..."
                className="h-12"
                autoFocus
              />
            </Field>
          )}
        </FieldGroup>
      </div>
    )
  }

  // ─── Componente principal ─────────────────────────────────────────────────────

  export default function PontoPage() {
    const { user } = useAuth()
    const { addPonto, updatePonto, getPontoByDate } = useData()

    const [mounted, setMounted] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [pontoSettings, setPontoSettings] = useState(getPontoSettings())
    const [selectedDate, setSelectedDate] = useState(getTodayString())
    const [errors, setErrors] = useState<string[]>([])

    const pontoHoje = user ? getPontoByDate(user.id, selectedDate) : null

    const [campos, setCampos] = useState<PeriodoFields>({
      entrada1: pontoHoje?.entrada1 || '',
      saida1:   pontoHoje?.saida1   || '',
      entrada2: pontoHoje?.entrada2 || '',
      saida2:   pontoHoje?.saida2   || '',
    })
    const [justificativa, setJustificativa] = useState(pontoHoje?.justificativaHoraExtra || '')

    const setField = (field: keyof PeriodoFields) => (value: string) =>
      setCampos((prev) => ({ ...prev, [field]: value }))

    // Efeitos
    useEffect(() => {
      setMounted(true)
      setPontoSettings(getPontoSettings())
      const timer = setInterval(() => setCurrentTime(new Date()), 1000)
      return () => clearInterval(timer)
    }, [])

    useEffect(() => {
      if (!pontoHoje) return
      setCampos({
        entrada1: pontoHoje.entrada1 || '',
        saida1:   pontoHoje.saida1   || '',
        entrada2: pontoHoje.entrada2 || '',
        saida2:   pontoHoje.saida2   || '',
      })
      setJustificativa(pontoHoje.justificativaHoraExtra || '')
    }, [pontoHoje])

    // Derivados
    const emRecesso = !!user && isInRecessPeriod(selectedDate, user.dataInicioRecesso, user.dataFimRecesso)

    const totalMinutos = calculateDayTotal(
      campos.entrada1 || null,
      campos.saida1   || null,
      campos.entrada2 || null,
      campos.saida2   || null,
    )

    const precisaJustificativa = totalMinutos > LIMITE_MINUTOS_SEM_JUSTIFICATIVA

    const { validate } = useValidatePonto(campos, justificativa, precisaJustificativa, pontoSettings.rejeitarMinutosZero)

    // Submit
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      if (emRecesso) {
        toast.error('Você está em período de recesso remunerado')
        return
      }

      const erros = validate()
      setErrors(erros)

      if (erros.length > 0) {
        toast.error('Corrija os erros antes de salvar')
        return
      }

      if (!user) return

      const pontoData = {
        userId: user.id,
        data: selectedDate,
        entrada1: campos.entrada1 || null,
        saida1:   campos.saida1   || null,
        entrada2: campos.entrada2 || null,
        saida2:   campos.saida2   || null,
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

    if (emRecesso) return <RecessoCard dataFimRecesso={user!.dataFimRecesso ?? undefined} />

    const animClass = (delay = 0) =>
      `transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`

    return (
      <>
        <PageHeader currentTime={currentTime} />

        <main className="flex-1 p-4 md:p-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            {/* Título */}
            <div className={`mb-6 ${animClass()}`}>
              <h2 className="text-2xl font-bold text-foreground">Ponto do Dia</h2>
              <p className="text-muted-foreground">{formatDate(selectedDate)}</p>
            </div>

            {/* Seletor de data */}
            <Card className={`mb-6 ${animClass()}`} style={{ transitionDelay: '50ms' }}>
              <CardContent className="pt-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="registro-data" className="text-foreground">Selecionar dia do mês</FieldLabel>
                    <Input
                      id="registro-data"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Cards de totais e regras */}
            <div className={`grid gap-6 mb-6 md:grid-cols-2 ${animClass()}`} style={{ transitionDelay: '100ms' }}>
              <CardTotalDia totalMinutos={totalMinutos} precisaJustificativa={precisaJustificativa} />
              <CardRegraPreenchimento />
            </div>

            {/* Formulário */}
            <Card className={animClass()} style={{ transitionDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="text-foreground">Horários</CardTitle>
                <CardDescription>Registre seus horários de entrada e saída</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <PeriodoInput
                    numero={1}
                    entradaId="entrada1"
                    saidaId="saida1"
                    entradaValue={campos.entrada1}
                    saidaValue={campos.saida1}
                    onEntradaChange={setField('entrada1')}
                    onSaidaChange={setField('saida1')}
                  />
                  <PeriodoInput
                    numero={2}
                    entradaId="entrada2"
                    saidaId="saida2"
                    entradaValue={campos.entrada2}
                    saidaValue={campos.saida2}
                    onEntradaChange={setField('entrada2')}
                    onSaidaChange={setField('saida2')}
                    obrigatorio
                  />

                  {precisaJustificativa && (
                    <JustificativaAlert justificativa={justificativa} onJustificativaChange={setJustificativa} />
                  )}

                  {errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {errors.map((error, i) => <li key={i}>{error}</li>)}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

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