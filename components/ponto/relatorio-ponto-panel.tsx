'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LABELS } from '@/lib/labels'
import { emptyLabel } from '@/lib/display-utils'
import { buildRelatorioPresencaRows } from '@/lib/relatorio-presenca'
import { formatMinutesToDisplay, isMesEncerrado } from '@/lib/time-utils'
import type { Justificativa, PontoRegistro, User } from '@/lib/types'
import { Download, FileBarChart2, Info, Loader2, Printer } from 'lucide-react'
import { toast } from 'sonner'

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

type RelatorioPontoPanelProps = {
  targetUser: User
  gestorNome?: string | null
  pontos: PontoRegistro[]
  justificativas: Justificativa[]
  getBancoHorasPorPeriodo: (userId: string, year: string, month: string) => number
  isPresencaBloqueada: (userId: string, data: string) => boolean
  title?: string
  description?: string
  showInfoAlert?: boolean
  printId?: string
}

export function RelatorioPontoPanel({
  targetUser,
  gestorNome,
  pontos,
  justificativas,
  getBancoHorasPorPeriodo,
  isPresencaBloqueada,
  title = 'Relatório mensal de presença',
  description,
  showInfoAlert = true,
  printId = 'relatorio-ponto-print',
}: RelatorioPontoPanelProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [downloading, setDownloading] = useState(false)

  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
  const periodoKey = `${selectedYear}-${selectedMonth}`
  const periodoLabel = `${MESES.find((m) => m.value === selectedMonth)?.label} de ${selectedYear}`
  const mesEncerrado = isMesEncerrado(selectedYear, selectedMonth)

  const resumo = useMemo(() => {
    const pontosPeriodo = pontos.filter(
      (p) =>
        p.userId === targetUser.id &&
        p.data.startsWith(periodoKey) &&
        !isPresencaBloqueada(targetUser.id, p.data),
    )
    const totalMes = pontosPeriodo.reduce((acc, p) => acc + p.totalMinutos, 0)
    const totalGeral = pontos
      .filter((p) => p.userId === targetUser.id && !isPresencaBloqueada(targetUser.id, p.data))
      .reduce((acc, p) => acc + p.totalMinutos, 0)
    const pontosRelatorio = buildRelatorioPresencaRows({
      year: selectedYear,
      month: selectedMonth,
      userId: targetUser.id,
      pontos: pontos.filter(
        (ponto) => ponto.userId === targetUser.id && !isPresencaBloqueada(targetUser.id, ponto.data),
      ),
      justificativas,
    })
    return {
      registros: pontosPeriodo.length,
      saldo: getBancoHorasPorPeriodo(targetUser.id, selectedYear, selectedMonth),
      totalMes,
      totalGeral,
      pontosRelatorio,
    }
  }, [
    targetUser.id,
    pontos,
    justificativas,
    periodoKey,
    selectedYear,
    selectedMonth,
    getBancoHorasPorPeriodo,
    isPresencaBloqueada,
  ])

  const handleDownloadPdf = async () => {
    if (!mesEncerrado) return
    setDownloading(true)
    try {
      const { downloadRelatorioUsuarioPdf } = await import('@/lib/pdf/relatorios')
      await downloadRelatorioUsuarioPdf({
        titulo: 'Relatório de Presença',
        periodoLabel,
        usuario: {
          nome: targetUser.nome,
          matricula: targetUser.matricula,
          departamento: targetUser.departamento,
        },
        gestorNome: gestorNome ?? emptyLabel(null),
        bancoHorasMinutos: resumo.saldo,
        totalHorasMesMinutos: resumo.totalMes,
        totalHorasGeralMinutos: resumo.totalGeral,
        pontos: resumo.pontosRelatorio,
        filename: `relatorio-presenca-${targetUser.matricula}-${periodoKey}.pdf`,
      })
      toast.success('PDF gerado com sucesso.')
    } catch {
      toast.error('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    if (!mesEncerrado) return
    window.print()
  }

  return (
    <div id={printId} className="space-y-4 print:space-y-2">
      {showInfoAlert ? (
        <Alert className="border-[#2f73e0]/30 bg-[#2f73e0]/5 print:hidden">
          <Info className="h-4 w-4 text-[#2f73e0]" />
          <AlertDescription>
            Relatórios de meses encerrados podem ser baixados em PDF ou impressos. O mês em andamento
            só pode ser consultado após o encerramento.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card data-fy-anchor="fy-relatorios-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart2 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            {description ?? `${targetUser.nome} — período: ${periodoLabel}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 print:hidden">
            <div className="space-y-1">
              <label htmlFor="relatorio-mes" className="text-xs text-muted-foreground">Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="relatorio-mes" className="w-44">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="relatorio-ano" className="text-xs text-muted-foreground">Ano</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="relatorio-ano" className="w-28">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!mesEncerrado ? (
              <p className="self-end text-xs text-amber-600">Mês em andamento — exportação disponível após encerramento.</p>
            ) : (
              <p className="self-end text-xs text-green-600">Mês encerrado — pronto para exportar.</p>
            )}
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 text-sm space-y-1">
            <p><span className="text-muted-foreground">Registros no período:</span> <strong>{resumo.registros}</strong></p>
            <p><span className="text-muted-foreground">Total de horas no período:</span> <strong>{formatMinutesToDisplay(resumo.totalMes)}</strong></p>
            <p><span className="text-muted-foreground">Total de horas (todos os meses):</span> <strong>{formatMinutesToDisplay(resumo.totalGeral)}</strong></p>
            <p><span className="text-muted-foreground">{LABELS.SALDO} no período:</span> <strong>{formatMinutesToDisplay(resumo.saldo)}</strong></p>
            {gestorNome ? (
              <p><span className="text-muted-foreground">Gestor(a):</span> <strong>{gestorNome}</strong></p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button onClick={handleDownloadPdf} disabled={downloading || !mesEncerrado}>
                      {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {downloading ? 'Gerando PDF…' : 'Baixar PDF'}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!mesEncerrado ? (
                  <TooltipContent>Disponível apenas para meses encerrados</TooltipContent>
                ) : null}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="outline" onClick={handlePrint} disabled={!mesEncerrado}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </Button>
                  </span>
                </TooltipTrigger>
                {!mesEncerrado ? (
                  <TooltipContent>Disponível apenas para meses encerrados</TooltipContent>
                ) : null}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
