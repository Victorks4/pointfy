'use client'

import { useEffect, useState } from 'react'
import { listFeriadosAction } from '@/app/actions/feriados'
import { createFeriadoAction, deleteFeriadoAction } from '@/app/actions/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'
import { formatDate } from '@/lib/time-utils'
import type { Feriado, FeriadoTipo } from '@/lib/types'

export default function FeriadosAdminPage() {
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState('')
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<FeriadoTipo>('empresa')

  const load = async () => {
    setLoading(true)
    const result = await listFeriadosAction()
    setLoading(false)
    if (result.success) setFeriados(result.data)
    else toast.error(result.error)
  }

  useEffect(() => {
    void load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data || !nome) {
      toast.error('Preencha data e nome')
      return
    }
    const result = await createFeriadoAction({ data, nome, tipo })
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Feriado cadastrado')
    setData('')
    setNome('')
    setTipo('empresa')
    void load()
  }

  const handleDelete = async (id: string, feriadoTipo: FeriadoTipo) => {
    if (feriadoTipo === 'nacional') {
      toast.error('Feriados nacionais não podem ser excluídos')
      return
    }
    const result = await deleteFeriadoAction(id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Feriado removido')
    void load()
  }

  const nacionais = feriados.filter((f) => f.tipo === 'nacional')
  const outros = feriados.filter((f) => f.tipo !== 'nacional')

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Feriados</h1>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Feriados nacionais</CardTitle>
              <CardDescription>Lista importada — somente leitura</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Nome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nacionais.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>{formatDate(f.data)}</TableCell>
                        <TableCell>{f.nome}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cadastrar feriado</CardTitle>
              <CardDescription>Municipais ou da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleCreate(e)}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="feriado-data">Data</FieldLabel>
                    <Input id="feriado-data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="feriado-nome">Nome</FieldLabel>
                    <Input id="feriado-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel>Tipo</FieldLabel>
                    <Select value={tipo} onValueChange={(v) => setTipo(v as FeriadoTipo)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="municipal">Municipal</SelectItem>
                        <SelectItem value="empresa">Empresa</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Button type="submit">Salvar feriado</Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feriados cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {outros.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{formatDate(f.data)}</TableCell>
                    <TableCell>{f.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{f.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete(f.id, f.tipo)}>
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
