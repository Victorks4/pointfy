'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatMinutesToDisplay } from '@/lib/time-utils'
import { Download } from 'lucide-react'
import { downloadRelatorioEstagiariosPdf, downloadRelatorioUsuarioPdf } from '@/lib/pdf/relatorios'

export default function AdminRelatoriosPage() {
  const { user } = useAuth()
  const { usuarios, pontos, getBancoHorasPorPeriodo } = useData()
  const [departamento, setDepartamento] = useState('')

  const currentYear = new Date().getFullYear()
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(String(currentYear))

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

  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))

  const estagiarios = useMemo(() => {
    return usuarios.filter(
      (u) => u.cargo === 'estagiario' && (!departamento || u.departamento.toLowerCase().includes(departamento.toLowerCase()))
    )
  }, [usuarios, departamento])

  const periodoKey = `${selectedYear}-${selectedMonth}`

  const pontosNoPeriodo = useMemo(() => {
    return pontos.filter((p) => p.data.startsWith(periodoKey))
  }, [pontos, periodoKey])

  const linhas = useMemo(() => {
    return estagiarios.map((usuario) => {
      const registros = pontosNoPeriodo.filter((p) => p.userId === usuario.id).length
      const bancoHorasMinutos = getBancoHorasPorPeriodo(usuario.id, selectedYear, selectedMonth)
      return {
        userId: usuario.id,
        nome: usuario.nome,
        ra: usuario.ra,
        departamento: usuario.departamento,
        registros,
        bancoHorasMinutos,
      }
    })
  }, [estagiarios, pontosNoPeriodo, getBancoHorasPorPeriodo, selectedYear, selectedMonth])

  const periodoLabel = `${MESES.find((m) => m.value === selectedMonth)?.label} de ${selectedYear}`

  const handleDownloadPdfGeral = () => {
    downloadRelatorioEstagiariosPdf({
      titulo: 'Relatório de Estagiários',
      filtroDepartamento: departamento,
      linhas: linhas.map((l) => ({
        nome: l.nome,
        ra: l.ra,
        departamento: l.departamento,
        registros: l.registros,
        bancoHorasMinutos: l.bancoHorasMinutos,
      })),
      periodoLabel,
      filename: `relatorio-estagiarios-${periodoKey}.pdf`,
    })
  }

  const handleDownloadPdfUsuario = (userId: string) => {
    const usuario = usuarios.find((u) => u.id === userId)
    if (!usuario) return

    const pontosUsuario = pontosNoPeriodo
      .filter((p) => p.userId === userId)
      .map((p) => ({
        data: p.data,
        entrada1: p.entrada1,
        saida1: p.saida1,
        entrada2: p.entrada2,
        saida2: p.saida2,
        totalMinutos: p.totalMinutos,
      }))

    const bancoHorasMinutos = getBancoHorasPorPeriodo(userId, selectedYear, selectedMonth)

    downloadRelatorioUsuarioPdf({
      titulo: 'Relatório do Estagiário',
      periodoLabel,
      usuario: {
        nome: usuario.nome,
        ra: usuario.ra,
        departamento: usuario.departamento,
      },
      bancoHorasMinutos,
      pontos: pontosUsuario,
      filename: `relatorio-${usuario.ra}-${periodoKey}.pdf`,
    })
  }

  if (user?.cargo !== 'admin') return null

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Relatórios</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre por departamento/área para montar o relatório.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-3 items-center flex-wrap">
              <Input
                placeholder="Ex: TI, RH, Marketing"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="w-72"
              />

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-44">
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
                <SelectTrigger className="w-28">
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

              <Button onClick={handleDownloadPdfGeral}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prévia do relatório</CardTitle>
            <CardDescription>
              {linhas.length} usuário(s) no filtro atual • {periodoLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {linhas.map((linha) => (
              <div key={linha.userId} className="rounded-lg border p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{linha.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {linha.departamento} • RA: {linha.ra} • Registros: {linha.registros} • Banco:{' '}
                    {formatMinutesToDisplay(linha.bancoHorasMinutos)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPdfUsuario(linha.userId)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
