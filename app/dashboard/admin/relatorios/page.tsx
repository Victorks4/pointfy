'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { formatMinutesToDisplay } from '@/lib/time-utils'
import { Download } from 'lucide-react'

export default function AdminRelatoriosPage() {
  const { user } = useAuth()
  const { usuarios, pontos, getBancoHoras } = useData()
  const [departamento, setDepartamento] = useState('')

  const estagiarios = useMemo(() => {
    return usuarios.filter(
      (u) => u.cargo === 'estagiario' && (!departamento || u.departamento.toLowerCase().includes(departamento.toLowerCase()))
    )
  }, [usuarios, departamento])

  const linhas = estagiarios.map((usuario) => ({
    nome: usuario.nome,
    departamento: usuario.departamento,
    registros: pontos.filter((p) => p.userId === usuario.id).length,
    banco: getBancoHoras(usuario.id),
  }))

  const handleDownloadCsv = () => {
    const csv = [
      'Nome,Departamento,Registros,BancoHoras',
      ...linhas.map((l) => `${l.nome},${l.departamento},${l.registros},${formatMinutesToDisplay(l.banco)}`),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-estagiarios.csv'
    link.click()
    URL.revokeObjectURL(url)
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
          <CardContent className="flex gap-3">
            <Input
              placeholder="Ex: TI, RH, Marketing"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
            />
            <Button onClick={handleDownloadCsv}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prévia do relatório</CardTitle>
            <CardDescription>{linhas.length} usuário(s) no filtro atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {linhas.map((linha) => (
              <div key={linha.nome} className="rounded-lg border p-3">
                <p className="font-medium">{linha.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {linha.departamento} • Registros: {linha.registros} • Banco: {formatMinutesToDisplay(linha.banco)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
