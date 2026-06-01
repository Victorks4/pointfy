'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import type { PontoConfig } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Plus, Pencil, Trash2, SlidersHorizontal, Check } from 'lucide-react'
import { formatMinutesToDisplay, formatDate } from '@/lib/time-utils'
import { getLimiteMinutosSemJustificativa } from '@/lib/ponto-config-utils'
import { LABELS } from '@/lib/labels'

type FormState = {
  nome: string
  metaDiariaMinutos: string
  limiteMinutosSemJustificativa: string
  rejeitarMinutosZero: boolean
  formatoDecimal: 'americano' | 'brasileiro'
  horarioEntradaEsperado: string
  ativo: boolean
}

const EMPTY_FORM: FormState = {
  nome: '',
  metaDiariaMinutos: '360',
  limiteMinutosSemJustificativa: '370',
  rejeitarMinutosZero: true,
  formatoDecimal: 'americano',
  horarioEntradaEsperado: '09:00',
  ativo: false,
}

function configToForm(config: PontoConfig): FormState {
  return {
    nome: config.nome,
    metaDiariaMinutos: String(config.metaDiariaMinutos),
    limiteMinutosSemJustificativa: String(config.limiteMinutosSemJustificativa),
    rejeitarMinutosZero: config.rejeitarMinutosZero,
    formatoDecimal: config.formatoDecimal,
    horarioEntradaEsperado: config.horarioEntradaEsperado,
    ativo: config.ativo,
  }
}

export default function AdminConfiguracoesPontoPage() {
  const { user } = useAuth()
  const {
    pontoConfigs,
    addPontoConfig,
    updatePontoConfig,
    deletePontoConfig,
    bloqueiosPresenca,
    addBloqueioPresenca,
    removeBloqueioPresenca,
    usuarios,
  } = useData()

  const [bloqueioUserId, setBloqueioUserId] = useState<string>('_all')
  const [bloqueioInicio, setBloqueioInicio] = useState('')
  const [bloqueioFim, setBloqueioFim] = useState('')
  const [bloqueioMotivo, setBloqueioMotivo] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  if (user?.cargo !== 'admin') return null

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setDialogOpen(true)
  }

  const openEdit = (config: PontoConfig) => {
    setForm(configToForm(config))
    setEditingId(config.id)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.nome.trim()) {
      toast.error('Informe um nome para a configuração.')
      return
    }

    const metaDiaria = Number(form.metaDiariaMinutos)
    const limiteJustificativa = getLimiteMinutosSemJustificativa({ metaDiariaMinutos: metaDiaria })

    if (isNaN(metaDiaria) || metaDiaria <= 0) {
      toast.error('Meta diária deve ser um número positivo.')
      return
    }

    const payload = {
      nome: form.nome.trim(),
      metaDiariaMinutos: metaDiaria,
      limiteMinutosSemJustificativa: limiteJustificativa,
      rejeitarMinutosZero: form.rejeitarMinutosZero,
      formatoDecimal: form.formatoDecimal,
      horarioEntradaEsperado: form.horarioEntradaEsperado,
      ativo: form.ativo,
      padrao: false,
    }

    if (editingId) {
      const editing = pontoConfigs.find(c => c.id === editingId)
      updatePontoConfig(editingId, { ...payload, padrao: editing?.padrao ?? false })
      toast.success('Configuração atualizada.')
    } else {
      addPontoConfig(payload)
      toast.success('Configuração criada.')
    }

    setDialogOpen(false)
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleDelete = () => {
    if (!deleteId) return
    const target = pontoConfigs.find(c => c.id === deleteId)
    if (target?.padrao) {
      toast.error('Não é possível excluir a configuração padrão.')
      setDeleteId(null)
      return
    }
    deletePontoConfig(deleteId)
    toast.success('Configuração excluída.')
    setDeleteId(null)
  }

  const handleActivate = (id: string) => {
    updatePontoConfig(id, { ativo: true })
    toast.success('Configuração ativada.')
  }

  const sortedConfigs = [...pontoConfigs].sort((a, b) => {
    if (a.padrao) return -1
    if (b.padrao) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">{LABELS.CONFIGURACOES_PRESENCA}</h1>
      </header>

      <main data-fy-anchor="fy-admin-config-main" className="flex-1 p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  Perfis de Configuração
                </CardTitle>
                <CardDescription>
                  Gerencie diferentes configurações de presença. A configuração ativa determina as regras aplicadas no registro.
                </CardDescription>
              </div>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Configuração
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Meta Diária</TableHead>
                  <TableHead>Limite s/ Justif.</TableHead>
                  <TableHead>Entrada Esperada</TableHead>
                  <TableHead>Min. Fechados</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedConfigs.map(config => (
                  <TableRow key={config.id} className={config.ativo ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {config.nome}
                        {config.padrao && (
                          <Badge variant="secondary" className="text-xs">Padrão</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatMinutesToDisplay(config.metaDiariaMinutos)}</TableCell>
                    <TableCell>{formatMinutesToDisplay(config.limiteMinutosSemJustificativa)}</TableCell>
                    <TableCell className="font-mono">{config.horarioEntradaEsperado}</TableCell>
                    <TableCell>{config.rejeitarMinutosZero ? 'Rejeita' : 'Aceita'}</TableCell>
                    <TableCell>
                      {config.ativo ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!config.ativo && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleActivate(config.id)}
                            title="Ativar esta configuração"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(config)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!config.padrao && (
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(config.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{LABELS.PRESENCA_BLOQUEADA}</CardTitle>
            <CardDescription>
              Impede registro de presença em datas específicas. Dias bloqueados não alteram o saldo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Estagiário</Label>
                <Select value={bloqueioUserId} onValueChange={setBloqueioUserId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todos os estagiários</SelectItem>
                    {usuarios
                      .filter((u) => u.cargo === 'estagiario')
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloqueio-inicio">Data início</Label>
                <Input
                  id="bloqueio-inicio"
                  type="date"
                  value={bloqueioInicio}
                  onChange={(e) => setBloqueioInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloqueio-fim">Data fim (opcional)</Label>
                <Input
                  id="bloqueio-fim"
                  type="date"
                  value={bloqueioFim}
                  onChange={(e) => setBloqueioFim(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloqueio-motivo">Motivo (opcional)</Label>
                <Input
                  id="bloqueio-motivo"
                  value={bloqueioMotivo}
                  onChange={(e) => setBloqueioMotivo(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() => {
                if (!bloqueioInicio) {
                  toast.error('Informe a data de início')
                  return
                }
                if (bloqueioFim && bloqueioFim < bloqueioInicio) {
                  toast.error('Data fim deve ser igual ou posterior ao início')
                  return
                }
                addBloqueioPresenca({
                  userId: bloqueioUserId === '_all' ? null : bloqueioUserId,
                  dataInicio: bloqueioInicio,
                  dataFim: bloqueioFim || null,
                  motivo: bloqueioMotivo.trim() || null,
                })
                toast.success('Bloqueio de presença criado')
                setBloqueioInicio('')
                setBloqueioFim('')
                setBloqueioMotivo('')
              }}
            >
              Bloquear presença
            </Button>

            {bloqueiosPresenca.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bloqueiosPresenca.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        {b.userId
                          ? usuarios.find((u) => u.id === b.userId)?.nome ?? '—'
                          : 'Todos os estagiários'}
                      </TableCell>
                      <TableCell>
                        {formatDate(b.dataInicio)}
                        {b.dataFim ? ` — ${formatDate(b.dataFim)}` : ''}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {b.motivo ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removeBloqueioPresenca(b.id)
                            toast.success('Bloqueio removido')
                          }}
                        >
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum bloqueio ativo.</p>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Configuração' : 'Nova Configuração'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Atualize os parâmetros desta configuração de presença.'
                : 'Defina os parâmetros para uma nova configuração de presença.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cfg-nome">Nome</Label>
              <Input
                id="cfg-nome"
                value={form.nome}
                onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Turno Integral (8h)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cfg-meta">Meta Diária (min)</Label>
                <Input
                  id="cfg-meta"
                  type="number"
                  min={1}
                  value={form.metaDiariaMinutos}
                  onChange={e => setForm(prev => ({ ...prev, metaDiariaMinutos: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  {Number(form.metaDiariaMinutos) > 0
                    ? formatMinutesToDisplay(Number(form.metaDiariaMinutos))
                    : '—'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cfg-limite">Justificativa obrigatória a partir de</Label>
                <Input
                  id="cfg-limite"
                  type="text"
                  readOnly
                  disabled
                  value={
                    Number(form.metaDiariaMinutos) > 0
                      ? formatMinutesToDisplay(
                          getLimiteMinutosSemJustificativa({
                            metaDiariaMinutos: Number(form.metaDiariaMinutos),
                          }),
                        )
                      : '—'
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Regra fixa: até este tempo (meta + 1h) sem justificativa; acima disso, obrigatório informar motivo.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cfg-entrada">Horário Esperado de Entrada</Label>
              <Input
                id="cfg-entrada"
                type="time"
                value={form.horarioEntradaEsperado}
                onChange={e => setForm(prev => ({ ...prev, horarioEntradaEsperado: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Formato Decimal</Label>
              <Select
                value={form.formatoDecimal}
                onValueChange={v => setForm(prev => ({ ...prev, formatoDecimal: v as 'americano' | 'brasileiro' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="americano">Americano (6.5)</SelectItem>
                  <SelectItem value="brasileiro">Brasileiro (6,5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                id="cfg-rejeitar"
                checked={form.rejeitarMinutosZero}
                onCheckedChange={v => setForm(prev => ({ ...prev, rejeitarMinutosZero: Boolean(v) }))}
              />
              <Label htmlFor="cfg-rejeitar" className="leading-5 cursor-pointer">
                Rejeitar minutos fechados (<span className="font-mono">:00</span>)
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="cfg-ativo"
                checked={form.ativo}
                onCheckedChange={v => setForm(prev => ({ ...prev, ativo: v }))}
              />
              <Label htmlFor="cfg-ativo">Ativar ao salvar</Label>
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
            <AlertDialogTitle>Excluir configuração?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Se esta configuração estiver ativa, a configuração padrão será reativada automaticamente.
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
