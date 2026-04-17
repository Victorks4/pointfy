'use client'
 
import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import {
  getTodayString,
  formatDate,
  calculateDayTotal,
  isValidTimeFormat,
  isValidTimeSequence,
  formatMinutesToDisplay,
  isInRecessPeriod,
} from '@/lib/time-utils'
import { JUSTIFICATIVAS_HORA_EXTRA } from '@/lib/types'
import type { PontoConfig } from '@/lib/types'
import { fyEmit } from '@/lib/fy-event-bus'
import { Clock, AlertCircle, Save, Info, CheckCircle, Timer, Coffee } from 'lucide-react'
 
// ─── Tipos ────────────────────────────────────────────────────────────────────
 
type PeriodoFields = {
  entrada1: string
  saida1: string
  entrada2: string
  saida2: string
}
 
type EstadoClock = 'red' | 'yellow' | 'green'
 
// ─── Constantes ───────────────────────────────────────────────────────────────

function buildRegrasPreenchimento(limiteMinutos: number) {
  return [
    { icon: AlertCircle, color: 'text-zinc-400', texto: 'Formato HH:MM obrigatório' },
    { icon: AlertCircle, color: 'text-zinc-400', texto: 'Horários "fechados" (minutos = 00) não são aceitos' },
    { icon: AlertCircle, color: 'text-zinc-400', texto: 'Saída deve ser após a entrada' },
    { icon: AlertCircle, color: 'text-zinc-400', texto: 'Sem sobreposição de horários' },
    { icon: Info,        color: 'text-blue-500',  texto: `Máximo de ${formatMinutesToDisplay(limiteMinutos)} sem justificativa` },
  ]
}
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
const hasClosedMinutes = (time: string): boolean => {
  const [, min] = time.split(':')
  return Number.isFinite(Number(min)) && Number(min) === 0
}
 
const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
 
// ─── Lógica do estado do relógio ──────────────────────────────────────────────
 
function getEstadoClock(minutos: number, meta: number): EstadoClock {
  const pct = minutos / meta
  if (pct >= 1) return 'green'
  if (pct >= 0.5) return 'yellow'
  return 'red'
}
 
const CLOCK_STATE_CONFIG: Record<EstadoClock, {
  ringColor: string
  waveColor: string
  label: string
}> = {
  red: {
    ringColor: 'border-red-500',
    waveColor: '#E24B4A',
    label: 'Início',
  },
  yellow: {
    ringColor: 'border-amber-400',
    waveColor: '#EF9F27',
    label: 'Progresso',
  },
  green: {
    ringColor: 'border-green-500',
    waveColor: '#639922',
    label: 'Completo',
  },
}
 
// ─── Hook de validação ────────────────────────────────────────────────────────
 
function useValidatePonto(
  campos: PeriodoFields,
  justificativa: string,
  precisaJustificativa: boolean,
  rejeitarMinutosZero: boolean,
  limiteMinutos: number,
) {
  const validate = useCallback((): string[] => {
    const { entrada1, saida1, entrada2, saida2 } = campos
    const erros: string[] = []

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

    const sequencias = [
      { anterior: entrada1, posterior: saida1,   msg: 'A Saída 1 deve ser após a Entrada 1' },
      { anterior: entrada2, posterior: saida2,   msg: 'A Saída 2 deve ser após a Entrada 2' },
      { anterior: saida1,   posterior: entrada2, msg: 'A Entrada 2 deve ser após a Saída 1' },
    ]

    for (const { anterior, posterior, msg } of sequencias) {
      if (anterior && posterior && !isValidTimeSequence(anterior, posterior))
        erros.push(msg)
    }

    if (!entrada1 || !saida1 || !entrada2 || !saida2)
      erros.push('Os campos dos dois períodos são obrigatórios')

    if (precisaJustificativa && !justificativa)
      erros.push(`Acima de ${formatMinutesToDisplay(limiteMinutos)} é necessário uma justificativa`)

    return erros
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campos, justificativa, precisaJustificativa, rejeitarMinutosZero, limiteMinutos])

  return { validate }
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
 
function CardRegraPreenchimento({ limiteMinutos }: { limiteMinutos: number }) {
  const regras = buildRegrasPreenchimento(limiteMinutos)

  return (
    <Card data-fy-anchor="fy-ponto-regras" className="border-zinc-200 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-zinc-900">Regras de Preenchimento</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-base text-[#5f7897]">
          {regras.map(({ icon: Icon, color, texto }) => (
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
 
// ─── Relógio com waves ────────────────────────────────────────────────────────
 
const WAVE_KEYFRAMES = `
@keyframes wave-move {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes pulse-ring {
  from { transform: scale(1); opacity: 0.6; }
  to   { transform: scale(1.5); opacity: 0; }
}
`

const WAVE_PATH =
  'M0 10 C12.5 2,25 18,50 10 C62.5 2,75 18,100 10 C112.5 2,125 18,150 10 C162.5 2,175 18,200 10 L200 20 L0 20 Z'

const ESTADO_BADGE_CLASS: Record<EstadoClock, string> = {
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
}

function WaveClock({ totalMinutos, meta }: { totalMinutos: number; meta: number }) {
  const progresso = Math.min((totalMinutos / meta) * 100, 100)
  const estado = getEstadoClock(totalMinutos, meta)
  const config = CLOCK_STATE_CONFIG[estado]
  const isComplete = estado === 'green'
  const fillHeight = `${Math.max(progresso, 4)}%`

  return (
    <div className="flex flex-col items-center gap-2">
      <style>{WAVE_KEYFRAMES}</style>

      <div className="relative">
        {isComplete && (
          <div
            className="absolute inset-0 rounded-full border-2 border-green-400 pointer-events-none"
            style={{
              zIndex: 0,
              animation: 'pulse-ring 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        )}

        <motion.div
          className={`relative w-24 h-24 rounded-full border-4 overflow-hidden ${config.ringColor}`}
          animate={{ borderColor: config.waveColor }}
          transition={{ duration: 0.5 }}
          aria-label={`Progresso diário: ${Math.round(progresso)}%`}
          role="img"
        >
          <div className="absolute inset-0 bg-slate-900" />

          <motion.div
            className="absolute inset-x-0 bottom-0 overflow-hidden"
            animate={{ height: fillHeight }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div
              style={{
                position: 'absolute',
                top: -10,
                left: 0,
                width: '200%',
                height: 20,
                animation: 'wave-move 2s linear infinite',
              }}
            >
              <svg
                viewBox="0 0 200 20"
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                <path d={WAVE_PATH} fill={config.waveColor} />
              </svg>
            </div>
            <div
              className="absolute inset-x-0 bottom-0"
              style={{ top: 10, background: config.waveColor }}
            />
          </motion.div>

          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                >
                  <CheckCircle className="h-9 w-9 text-white drop-shadow" />
                </motion.div>
              ) : (
                <motion.span
                  key="pct"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold text-white drop-shadow"
                >
                  {Math.round(progresso)}%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <motion.span
        key={estado}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_BADGE_CLASS[estado]}`}
      >
        {config.label}
      </motion.span>
    </div>
  )
}
 
// ─── Card Total do Dia ────────────────────────────────────────────────────────
 
function CardTotalDia({
  totalMinutos,
  precisaJustificativa,
  metaDiaria,
  limiteMinutos,
}: {
  totalMinutos: number
  precisaJustificativa: boolean
  metaDiaria: number
  limiteMinutos: number
}) {
  const progresso = Math.min((totalMinutos / metaDiaria) * 100, 100)
  const isComplete = totalMinutos >= metaDiaria
  const estado = getEstadoClock(totalMinutos, metaDiaria)
 
  const barColor =
    estado === 'red' ? 'bg-red-500' : estado === 'yellow' ? 'bg-amber-400' : 'bg-green-500'
 
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
          <motion.div
            key={totalMinutos}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className={`text-4xl font-bold transition-colors duration-300 ${
              totalMinutos > 0 ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {formatMinutesToDisplay(totalMinutos)}
          </motion.div>
          <div className="text-sm text-muted-foreground pb-1">
            / {formatMinutesToDisplay(metaDiaria)} meta
          </div>
        </div>
 
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
            {/* Barra de progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso da meta</span>
                <span className="font-medium text-foreground">{Math.round(progresso)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${barColor}`}
                  animate={{ width: `${Math.max(progresso, 2)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
 
            {/* Relógio com waves */}
            <WaveClock totalMinutos={totalMinutos} meta={metaDiaria} />
          </div>
        </div>
 
        <AnimatePresence>
          {precisaJustificativa && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-700">
                Acima de {formatMinutesToDisplay(limiteMinutos)} — justificativa obrigatória
              </p>
            </motion.div>
          )}
        </AnimatePresence>
 
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">Meta diária atingida! Bom trabalho.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
 
// ─── PeriodoInput ─────────────────────────────────────────────────────────────
 
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
 
// ─── JustificativaAlert (bug corrigido) ───────────────────────────────────────
 
function JustificativaAlert({
  justificativa,
  onJustificativaChange,
  limiteMinutos,
}: {
  justificativa: string
  onJustificativaChange: (v: string) => void
  limiteMinutos: number
}) {
  // Rastreia qual opção está selecionada no Select, separado do valor final.
  // Isso corrige o bug: antes, ao selecionar "Outro", o pai recebia '' e
  // isOutro ficava false, nunca exibindo o campo de texto.
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>(() => {
    const opcoesFixas = JUSTIFICATIVAS_HORA_EXTRA.filter((j) => j !== 'Outro')
    return opcoesFixas.includes(justificativa) ? justificativa : justificativa ? 'Outro' : ''
  })
 
  const isOutro = opcaoSelecionada === 'Outro'
 
  const handleSelectChange = (v: string) => {
    setOpcaoSelecionada(v)
    if (v !== 'Outro') {
      // Opção fixa: repassa o valor diretamente ao pai
      onJustificativaChange(v)
    } else {
      // "Outro" selecionado: limpa o valor final até o usuário digitar
      onJustificativaChange('')
    }
  }
 
  const handleOutroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Valor digitado vai direto ao pai como justificativa final
    onJustificativaChange(e.target.value)
  }
 
  return (
    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
      <Alert className="mb-4 border-blue-200 bg-blue-100/40">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Você está registrando mais de {formatMinutesToDisplay(limiteMinutos)}.
          Por favor, selecione uma justificativa.
        </AlertDescription>
      </Alert>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="justificativa" className="text-foreground">
            Justificativa para Hora Extra
          </FieldLabel>
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
 
        {/* Campo exibido corretamente ao selecionar "Outro" */}
        <AnimatePresence>
          {isOutro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Field>
                <FieldLabel htmlFor="outro-motivo" className="text-foreground">
                  Descreva o motivo
                </FieldLabel>
                <Input
                  id="outro-motivo"
                  value={justificativa}
                  onChange={handleOutroChange}
                  placeholder="Descreva o motivo da hora extra..."
                  className="h-12"
                  autoFocus
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
      </FieldGroup>
    </div>
  )
}
 
// ─── Componente principal ─────────────────────────────────────────────────────
 
export default function PontoPage() {
  const { user } = useAuth()
  const { addPonto, updatePonto, getPontoByDate, getActivePontoConfig } = useData()
  const activeConfig = getActivePontoConfig()
 
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
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
 
  const setField = useCallback(
    (field: keyof PeriodoFields) => (value: string) =>
      setCampos((prev) => ({ ...prev, [field]: value })),
    [],
  )
 
  // Efeitos
  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
 
  useEffect(() => {
    if (!pontoHoje) {
      setCampos({ entrada1: '', saida1: '', entrada2: '', saida2: '' })
      setJustificativa('')
      return
    }
    setCampos({
      entrada1: pontoHoje.entrada1 || '',
      saida1:   pontoHoje.saida1   || '',
      entrada2: pontoHoje.entrada2 || '',
      saida2:   pontoHoje.saida2   || '',
    })
    setJustificativa(pontoHoje.justificativaHoraExtra || '')
  }, [pontoHoje])
 
  // Persistência de rascunho (não sobrescreve registros já salvos)
  useEffect(() => {
    if (!pontoHoje) {
      sessionStorage.setItem(`ponto-draft-${selectedDate}`, JSON.stringify(campos))
    }
  }, [campos, selectedDate, pontoHoje])
 
  // Restaura rascunho ao trocar de data (se não houver registro salvo)
  useEffect(() => {
    if (!pontoHoje) {
      const draft = sessionStorage.getItem(`ponto-draft-${selectedDate}`)
      if (draft) {
        try { setCampos(JSON.parse(draft)) } catch { /* ignora */ }
      }
    }
  }, [selectedDate, pontoHoje])
 
  // Derivados
  const emRecesso = useMemo(
    () => !!user && isInRecessPeriod(selectedDate, user.dataInicioRecesso, user.dataFimRecesso),
    [user, selectedDate],
  )
 
  const totalMinutos = useMemo(
    () => calculateDayTotal(
      campos.entrada1 || null,
      campos.saida1   || null,
      campos.entrada2 || null,
      campos.saida2   || null,
    ),
    [campos],
  )
 
  const precisaJustificativa = totalMinutos > activeConfig.limiteMinutosSemJustificativa

  const { validate } = useValidatePonto(
    campos,
    justificativa,
    precisaJustificativa,
    activeConfig.rejeitarMinutosZero,
    activeConfig.limiteMinutosSemJustificativa,
  )
 
  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
 
    if (emRecesso) {
      toast.error('Você está em período de recesso remunerado')
      fyEmit({ type: 'ponto:error' })
      return
    }
 
    const erros = validate()
    setErrors(erros)
 
    if (erros.length > 0) {
      toast.error('Corrija os erros antes de salvar')
      fyEmit({ type: 'ponto:error' })
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

    // Emitir evento de sucesso para o Fy
    fyEmit({ type: 'ponto:saved', success: true })
    setErrors([])
  }
 
  if (emRecesso) return <RecessoCard dataFimRecesso={user!.dataFimRecesso ?? undefined} />
 
  const fadeIn = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    transition: { duration: 0.35, delay, ease: 'easeOut' },
  })
 
  return (
    <>
      <PageHeader currentTime={currentTime} />
 
      <main className="flex-1 p-4 md:p-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          {/* Título */}
          <motion.div className="mb-6" {...fadeIn(0)}>
            <h2 className="text-2xl font-bold text-foreground">Ponto do Dia</h2>
            <p className="text-muted-foreground">{formatDate(selectedDate)}</p>
          </motion.div>
 
          {/* Seletor de data */}
          <motion.div {...fadeIn(0.05)}>
            <Card className="mb-6">
              <CardContent className="pt-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="registro-data" className="text-foreground">
                      Selecionar dia do mês
                    </FieldLabel>
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
          </motion.div>
 
          {/* Cards de totais e regras */}
          <motion.div
            className="grid gap-6 mb-6 md:grid-cols-2"
            {...fadeIn(0.1)}
          >
            <CardTotalDia
              totalMinutos={totalMinutos}
              precisaJustificativa={precisaJustificativa}
              metaDiaria={activeConfig.metaDiariaMinutos}
              limiteMinutos={activeConfig.limiteMinutosSemJustificativa}
            />
            <CardRegraPreenchimento limiteMinutos={activeConfig.limiteMinutosSemJustificativa} />
          </motion.div>
 
          {/* Formulário */}
          <motion.div {...fadeIn(0.18)}>
            <Card data-fy-anchor="fy-ponto-form">
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
 
                  <AnimatePresence>
                    {precisaJustificativa && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <JustificativaAlert
                          justificativa={justificativa}
                          onJustificativaChange={setJustificativa}
                          limiteMinutos={activeConfig.limiteMinutosSemJustificativa}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
 
                  <AnimatePresence>
                    {errors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <ul className="list-disc list-inside space-y-1">
                              {errors.map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
 
                  <Button
                    type="submit"
                    data-fy-anchor="fy-save-ponto"
                    className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  >
                    <Save className="mr-2 h-5 w-5" />
                    {pontoHoje ? 'Atualizar Ponto' : 'Registrar Ponto'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </>
  )
}
