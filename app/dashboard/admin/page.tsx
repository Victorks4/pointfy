'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatMinutesToDisplay, formatDate } from '@/lib/time-utils'
import type { User } from '@/lib/types'
import { Users, Clock, TrendingUp, TrendingDown, Calendar, Search } from 'lucide-react'

type EstagiarioComMetricas = User & {
  horasMes: number
  bancoHoras: number
  diasTrabalhados: number
}

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

export default function AdminPage() {
  const { user } = useAuth()
  const { usuarios, pontos, getBancoHorasPorPeriodo } = useData()
  const router = useRouter()

  const currentYear = new Date().getFullYear()
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [departamentoFiltro, setDepartamentoFiltro] = useState('')
  const [busca, setBusca] = useState('')

  // Verificar se é admin
  useEffect(() => {
    if (!user || user.cargo === 'admin') return
    if (user.cargo === 'gestor') {
      router.replace('/dashboard/gestor')
      return
    }
    router.replace('/dashboard')
  }, [user, router])

  if (user?.cargo !== 'admin') {
    return null
  }

  // Estatísticas gerais
  const totalUsuarios = usuarios.filter(u => u.cargo === 'estagiario').length
  const pontosDoMes = pontos.filter(p => {
    const [ano, mes] = p.data.split('-')
    return ano === selectedYear && mes === selectedMonth
  })
  const totalHorasMes = pontosDoMes.reduce((acc, p) => acc + p.totalMinutos, 0)

  // Calcular estatísticas por usuário
  const usuariosEstagiarios = usuarios.filter(u => u.cargo === 'estagiario')
  const usuariosComDados: EstagiarioComMetricas[] = usuariosEstagiarios.map((usuario) => {
    const pontosUsuario = pontos.filter(p => {
      const [ano, mes] = p.data.split('-')
      return p.userId === usuario.id && ano === selectedYear && mes === selectedMonth
    })
    const horasMes = pontosUsuario.reduce((acc, p) => acc + p.totalMinutos, 0)
    const bancoHoras = getBancoHorasPorPeriodo(usuario.id, selectedYear, selectedMonth)
    const diasTrabalhados = pontosUsuario.length

    return {
      ...usuario,
      horasMes,
      bancoHoras,
      diasTrabalhados,
    }
  })

  const usuariosComDadosFiltradosOrdenados = usuariosComDados
    .filter((u) => {
      const departamentoOk = !departamentoFiltro || u.departamento.toLowerCase().includes(departamentoFiltro.toLowerCase())
      const buscaOk =
        !busca ||
        u.nome.toLowerCase().includes(busca.toLowerCase()) ||
        u.ra.toLowerCase().includes(busca.toLowerCase())
      return departamentoOk && buscaOk
    })
    .sort((a, b) => {
      // Ordem fixa: mais horas a cumprir (bancoHoras mais negativo) -> mais horas feitas
      if (a.bancoHoras !== b.bancoHoras) return a.bancoHoras - b.bancoHoras
      // Desempate: mais horas no mês primeiro
      if (a.horasMes !== b.horasMes) return b.horasMes - a.horasMes
      return a.nome.localeCompare(b.nome)
    })

  // Dialog de opções administrativas
  const [selectedUser, setSelectedUser] = useState<EstagiarioComMetricas | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const handleUserClick = (row: EstagiarioComMetricas) => {
    setSelectedUser(row)
    setDialogOpen(true)
  }
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedUser(null)
  }

  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Painel Administrativo</h1>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div data-fy-anchor="fy-admin-hero" className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Visão Geral
          </h2>
          <p className="text-muted-foreground">
            Acompanhe os registros de ponto de todos os usuários
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Estagiários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsuarios}</div>
              <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Registros no Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pontosDoMes.length}</div>
              <p className="text-xs text-muted-foreground">Pontos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMinutesToDisplay(totalHorasMes)}</div>
              <p className="text-xs text-muted-foreground">No período selecionado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Filtrar Período</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="flex-1">
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
                <SelectTrigger className="w-20">
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
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo por Usuário</CardTitle>
            <CardDescription>
              {MESES.find(m => m.value === selectedMonth)?.label} de {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-center mb-4 flex-wrap">
              <Input
                placeholder="Filtrar por departamento"
                value={departamentoFiltro}
                onChange={(e) => setDepartamentoFiltro(e.target.value)}
                className="w-64"
              />

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar estagiário (nome ou RA)"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>

            {usuariosComDadosFiltradosOrdenados.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>RA</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead className="text-center">Dias Trabalhados</TableHead>
                      <TableHead className="text-right">Horas no Mês</TableHead>
                      <TableHead className="text-right">Banco de Horas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuariosComDadosFiltradosOrdenados.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <button
                            className="hover:underline text-blue-700"
                            onClick={() => handleUserClick(u)}
                          >
                            {u.nome}
                          </button>
                        </TableCell>
                        <TableCell>{u.ra}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{u.departamento}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{u.diasTrabalhados}</TableCell>
                        <TableCell className="text-right">
                          {formatMinutesToDisplay(u.horasMes)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold flex items-center justify-end gap-1 ${u.bancoHoras >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {u.bancoHoras >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {formatMinutesToDisplay(u.bancoHoras)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum estagiário cadastrado
              </div>
            )}
          </CardContent>
        </Card>
      </main>
          {/* Dialog administrativo */}
          {dialogOpen && selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-2">Opções para {selectedUser.nome}</h3>
                <p className="text-sm text-muted-foreground mb-4">RA: {selectedUser.ra} | Departamento: {selectedUser.departamento}</p>
                <div className="flex flex-col gap-3">
                  <button
                    className="w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    onClick={() => {
                      router.push(`/dashboard/historico?userId=${selectedUser.id}`)
                      handleCloseDialog()
                    }}
                  >
                    Ver histórico de ponto
                  </button>
                  <button
                    className="w-full py-2 px-4 rounded bg-gray-100 text-blue-700 font-semibold hover:bg-gray-200 transition"
                    onClick={() => { router.push(`/dashboard/admin/usuarios?edit=${selectedUser.id}`); handleCloseDialog(); }}
                  >
                    Editar dados do usuário
                  </button>
                </div>
                <button
                  className="mt-6 w-full py-2 px-4 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition"
                  onClick={handleCloseDialog}
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
    </>
  )
}
