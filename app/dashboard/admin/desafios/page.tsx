'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import type { DesafioSemanal, TipoDesafio } from '@/lib/types'
import { TIPO_DESAFIO_LABELS } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Target } from 'lucide-react'

type FormState = {
  titulo: string
  descricao: string
  tipo: TipoDesafio
  meta: string
  recompensa: string
  dataInicio: string
  dataFim: string
  ativo: boolean
}

const EMPTY_FORM: FormState = {
  titulo: '',
  descricao: '',
  tipo: 'meta_horas',
  meta: '',
  recompensa: '',
  dataInicio: '',
  dataFim: '',
  ativo: true,
}

function getNextMonday(): string {
  const today = new Date()
  const day = today.getDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + daysUntilMonday)
  return monday.toISOString().split('T')[0]
}

function getNextSunday(mondayStr: string): string {
  const monday = new Date(`${mondayStr}T00:00:00`)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return sunday.toISOString().split('T')[0]
}

function formatDateBR(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('pt-BR')
}

export default function AdminDesafiosPage() {
  const { user } = useAuth()
  const { desafios, addDesafio, updateDesafio, deleteDesafio } = useData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  if (user?.cargo !== 'admin') return null

  const openCreate = () => {
    const monday = getNextMonday()
    setForm({ ...EMPTY_FORM, dataInicio: monday, dataFim: getNextSunday(monday) })
    setEditingId(null)
    setDialogOpen(true)
  }

  const openEdit = (desafio: DesafioSemanal) => {
    setForm({
      titulo: desafio.titulo,
      descricao: desafio.descricao,
      tipo: desafio.tipo,
      meta: String(desafio.meta),
      recompensa: desafio.recompensa,
      dataInicio: desafio.dataInicio,
      dataFim: desafio.dataFim,
      ativo: desafio.ativo,
    })
    setEditingId(desafio.id)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.titulo.trim() || !form.dataInicio || !form.dataFim) {
      toast.error('Preencha título, data de início e data de fim.')
      return
    }

    const metaNum = Number(form.meta)
    if (isNaN(metaNum) || metaNum <= 0) {
      toast.error('Informe uma meta numérica válida.')
      return
    }

    if (form.dataFim < form.dataInicio) {
      toast.error('Data de fim deve ser posterior à data de início.')
      return
    }

    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      tipo: form.tipo,
      meta: metaNum,
      recompensa: form.recompensa.trim(),
      dataInicio: form.dataInicio,
      dataFim: form.dataFim,
      ativo: form.ativo,
    }

    if (editingId) {
      updateDesafio(editingId, payload)
      toast.success('Desafio atualizado.')
    } else {
      addDesafio(payload)
      toast.success('Desafio criado.')
    }

    setDialogOpen(false)
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteDesafio(deleteId)
    toast.success('Desafio excluído.')
    setDeleteId(null)
  }

  const sortedDesafios = [...desafios].sort(
    (a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime()
  )

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Desafios Semanais</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Gerenciar Desafios
                </CardTitle>
                <CardDescription>Crie, edite e gerencie desafios semanais para os estagiários.</CardDescription>
              </div>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Desafio
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sortedDesafios.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum desafio criado ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDesafios.map(desafio => (
                    <TableRow key={desafio.id}>
                      <TableCell className="font-medium">{desafio.titulo}</TableCell>
                      <TableCell>{TIPO_DESAFIO_LABELS[desafio.tipo]}</TableCell>
                      <TableCell>{desafio.meta}</TableCell>
                      <TableCell>
                        {formatDateBR(desafio.dataInicio)} - {formatDateBR(desafio.dataFim)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={desafio.ativo ? 'default' : 'secondary'}>
                          {desafio.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(desafio)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(desafio.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Desafio' : 'Novo Desafio'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os campos abaixo.' : 'Preencha os campos para criar um desafio semanal.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Completar 30h na semana"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o desafio..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={v => setForm(prev => ({ ...prev, tipo: v as TipoDesafio }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TIPO_DESAFIO_LABELS) as [TipoDesafio, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta">Meta</Label>
                <Input
                  id="meta"
                  type="number"
                  min={1}
                  value={form.meta}
                  onChange={e => setForm(prev => ({ ...prev, meta: e.target.value }))}
                  placeholder="Ex: 5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recompensa">Recompensa</Label>
              <Input
                id="recompensa"
                value={form.recompensa}
                onChange={e => setForm(prev => ({ ...prev, recompensa: e.target.value }))}
                placeholder="Ex: Badge de Dedicação"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={form.dataInicio}
                  onChange={e => setForm(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={form.dataFim}
                  onChange={e => setForm(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={v => setForm(prev => ({ ...prev, ativo: v }))}
              />
              <Label htmlFor="ativo">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir desafio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O desafio e todo o progresso associado serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
