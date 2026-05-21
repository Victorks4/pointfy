'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LABELS } from '@/lib/labels'
import { formatMinutesToDisplay } from '@/lib/time-utils'
import { Download, FileBarChart2, Info, Loader2 } from 'lucide-react'
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

export default function RelatoriosEstagiarioPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { pontos, usuarios, getBancoHorasPorPeriodo, isPresencaBloqueada } = useData()
  const [downloading, setDownloading] = useState(false)

  const currentYear = new Date().getFullYear()
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(String(currentYear))

  useEffect(() => {
    if (user && user.cargo !== 'estagiario') {
      router.replace('/dashboard')
    }
  }, [user, router])

  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
  const periodoKey = `${selectedYear}-${selectedMonth}`
  const periodoLabel = `${MESES.find((m) => m.value === selectedMonth)?.label} de ${selectedYear}`

  const gestorNome = useMemo(() => {
    if (!user?.gestorId) return null
    return usuarios.find((u) => u.id === user.gestorId)?.nome ?? null
  }, [user, usuarios])

  const resumo = useMemo(() => {
    if (!user) return null
    const pontosPeriodo = pontos.filter(
      (p) => p.userId === user.id && p.data.startsWith(periodoKey) && !isPresencaBloqueada(user.id, p.data),
    )
    const totalMes = pontosPeriodo.reduce((acc, p) => acc + p.totalMinutos, 0)
    const totalGeral = pontos
      .filter((p) => p.userId === user.id && !isPresencaBloqueada(user.id, p.data))
      .reduce((acc, p) => acc + p.totalMinutos, 0)
    return {
      registros: pontosPeriodo.length,
      saldo: getBancoHorasPorPeriodo(user.id, selectedYear, selectedMonth),
      totalMes,
      totalGeral,
      pontosPeriodo,
    }
  }, [user, pontos, periodoKey, selectedYear, selectedMonth, getBancoHorasPorPeriodo, isPresencaBloqueada])

  const handleDownloadPdf = async () => {
    if (!user || !resumo) return
    if (resumo.registros === 0) {
      toast.error('Não há registros de presença neste período para gerar o PDF.')
      return
    }

    setDownloading(true)
    try {
      const { downloadRelatorioUsuarioPdf } = await import('@/lib/pdf/relatorios')
      await downloadRelatorioUsuarioPdf({
        titulo: 'Relatório de Presença',
        periodoLabel,
        usuario: {
          nome: user.nome,
          ra: user.ra,
          departamento: user.departamento,
        },
        gestorNome,
        bancoHorasMinutos: resumo.saldo,
        totalHorasMesMinutos: resumo.totalMes,
        totalHorasGeralMinutos: resumo.totalGeral,
        pontos: resumo.pontosPeriodo.map((p) => ({
          data: p.data,
          entrada1: p.entrada1,
          saida1: p.saida1,
          entrada2: p.entrada2,
          saida2: p.saida2,
          totalMinutos: p.totalMinutos,
          observacao: p.observacao,
        })),
        filename: `relatorio-presenca-${user.ra}-${periodoKey}.pdf`,
      })
      toast.success('PDF gerado. Acesse o portal de assinatura da empresa para assinar o documento.')
    } catch {
      toast.error('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setDownloading(false)
    }
  }

  if (!user || user.cargo !== 'estagiario') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground text-sm">
        Redirecionando…
      </div>
    )
  }

  const semRegistros = resumo?.registros === 0

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Relatórios</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-3xl">
        <Alert className="border-[#2f73e0]/30 bg-[#2f73e0]/5">
          <Info className="h-4 w-4 text-[#2f73e0]" />
          <AlertDescription>
            Baixe seu relatório de presença em PDF (padrão SENAI) e envie ao portal de assinatura externo da
            empresa. A assinatura digital não é feita neste sistema.
          </AlertDescription>
        </Alert>

        <Card data-fy-anchor="fy-relatorios-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5" />
              Meu relatório mensal
            </CardTitle>
            <CardDescription>Período: {periodoLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <label htmlFor="relatorio-mes" className="text-xs text-muted-foreground">
                  Mês
                </label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="relatorio-mes" className="w-44">
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
              </div>

              <div className="space-y-1">
                <label htmlFor="relatorio-ano" className="text-xs text-muted-foreground">
                  Ano
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="relatorio-ano" className="w-28">
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
              </div>
            </div>

            {semRegistros ? (
              <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Nenhum registro neste período</p>
                <p className="mt-1">
                  Registre sua presença nos dias trabalhados antes de gerar o relatório para assinatura.
                </p>
              </div>
            ) : (
              resumo && (
                <div className="rounded-xl border bg-muted/40 p-4 text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Registros no período:</span>{' '}
                    <strong>{resumo.registros}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Total de horas no período:</span>{' '}
                    <strong>{formatMinutesToDisplay(resumo.totalMes)}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Total de horas (todos os meses):</span>{' '}
                    <strong>{formatMinutesToDisplay(resumo.totalGeral)}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">{LABELS.SALDO} no período:</span>{' '}
                    <strong>{formatMinutesToDisplay(resumo.saldo)}</strong>
                  </p>
                  {gestorNome ? (
                    <p>
                      <span className="text-muted-foreground">Gestor(a):</span>{' '}
                      <strong>{gestorNome}</strong>
                    </p>
                  ) : null}
                </div>
              )
            )}

            <Button
              onClick={handleDownloadPdf}
              disabled={downloading || semRegistros}
              className="w-full sm:w-auto"
            >
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloading ? 'Gerando PDF…' : 'Baixar PDF para assinatura externa'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
