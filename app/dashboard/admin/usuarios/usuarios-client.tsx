'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  formatDate,
  formatMinutesToDisplay,
  getTodayString,
  isInRecessPeriod,
  isUserInRecessPeriod,
  isAnyRecessApproaching,
  isRecessApproaching,
} from '@/lib/time-utils'
import type { User } from '@/lib/types'
import { UserPlus, Users, Calendar, Info, AlertCircle, Search, Shield, Plus, X } from 'lucide-react'

const DEPARTAMENTOS = [
  'TI',
  'RH',
  'Financeiro',
  'Marketing',
  'Comercial',
  'Jurídico',
  'Operações',
  'Administrativo',
]

const CARGAS_HORARIAS = [
  { value: '1200', label: '20h semanais' },
  { value: '1500', label: '25h semanais' },
  { value: '1800', label: '30h semanais' },
  { value: '2400', label: '40h semanais' },
]

function getGestorNomes(usuario: User, usuarios: User[]): string {
  const ids = new Set<string>()
  if (usuario.gestorId) ids.add(usuario.gestorId)
  for (const id of usuario.gestorIds ?? []) ids.add(id)
  const nomes = [...ids]
    .map((id) => usuarios.find((x) => x.id === id)?.nome)
    .filter(Boolean)
  return nomes.length > 0 ? nomes.join(', ') : '—'
}

function getGestoresDisponiveis(gestoresLista: User[], selectedIds: string[], currentValue: string): User[] {
  const others = new Set(selectedIds.filter((id) => id !== '_none' && id !== currentValue))
  return gestoresLista.filter((g) => !others.has(g.id))
}

function validateDateRange(inicio: string, fim: string, label: string): boolean {
  if (inicio && fim && fim < inicio) {
    toast.error(`${label}: a data fim deve ser após o início`)
    return false
  }
  return true
}

export default function UsuariosAdminPage() {
  const router = useRouter()
  const { usuarios, addUsuario, updateUsuario, deleteUsuario, getBancoHoras } = useData()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [departamentoFiltro, setDepartamentoFiltro] = useState('')
  const [busca, setBusca] = useState('')

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [matricula, setMatricula] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [cargaHoraria, setCargaHoraria] = useState('')
  const [dataInicioContrato, setDataInicioContrato] = useState('')
  const [dataFimContrato, setDataFimContrato] = useState('')
  const [dataInicioRecesso1, setDataInicioRecesso1] = useState('')
  const [dataFimRecesso1, setDataFimRecesso1] = useState('')
  const [dataInicioRecesso2, setDataInicioRecesso2] = useState('')
  const [dataFimRecesso2, setDataFimRecesso2] = useState('')
  const [novoCargoCadastro, setNovoCargoCadastro] = useState<'estagiario' | 'gestor'>('estagiario')
  const [novoGestorId, setNovoGestorId] = useState<string>('_none')
  const [extraGestorIds, setExtraGestorIds] = useState<string[]>([])
  const [gestorVinculoId, setGestorVinculoId] = useState<string>('_none')
  const [editExtraGestorIds, setEditExtraGestorIds] = useState<string[]>([])
  const [senha, setSenha] = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')

  const selectedUser = selectedUserId ? usuarios.find((u) => u.id === selectedUserId) ?? null : null
  const today = getTodayString()

  const resetNovoUsuarioForm = () => {
    setNome('')
    setEmail('')
    setMatricula('')
    setDepartamento('')
    setCargaHoraria('')
    setDataInicioContrato('')
    setDataFimContrato('')
    setDataInicioRecesso1('')
    setDataFimRecesso1('')
    setDataInicioRecesso2('')
    setDataFimRecesso2('')
    setNovoCargoCadastro('estagiario')
    setNovoGestorId('_none')
    setExtraGestorIds([])
    setSenha('')
    setConfirmSenha('')
  }

  const estagiarios = usuarios.filter((u) => u.cargo === 'estagiario')
  const gestoresLista = usuarios.filter((u) => u.cargo === 'gestor')
  const estagiariosFiltrados = estagiarios.filter((u) => {
    const departamentoOk =
      !departamentoFiltro || u.departamento.toLowerCase().includes(departamentoFiltro.toLowerCase())
    const buscaOk =
      !busca ||
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.matricula.toLowerCase().includes(busca.toLowerCase())
    return departamentoOk && buscaOk
  })

  const createSelectedGestorIds = () => [novoGestorId, ...extraGestorIds]
  const editSelectedGestorIds = () => [gestorVinculoId, ...editExtraGestorIds]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome || !email || !matricula || !departamento || !cargaHoraria) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (!senha || senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (senha !== confirmSenha) {
      toast.error('As senhas não coincidem')
      return
    }

    if (usuarios.some((u) => u.email === email)) {
      toast.error('Este email já está cadastrado')
      return
    }

    if (usuarios.some((u) => u.matricula === matricula)) {
      toast.error('Esta matrícula já está cadastrada')
      return
    }

    if (!validateDateRange(dataInicioContrato, dataFimContrato, 'Contrato')) return
    if (!validateDateRange(dataInicioRecesso1, dataFimRecesso1, 'Recesso 1')) return
    if (!validateDateRange(dataInicioRecesso2, dataFimRecesso2, 'Recesso 2')) return

    if (novoCargoCadastro === 'estagiario' && novoGestorId === '_none') {
      toast.error('Selecione o gestor principal do estagiário')
      return
    }

    if (novoCargoCadastro === 'estagiario' && gestoresLista.length === 0) {
      toast.error('Cadastre um gestor antes de vincular o estagiário')
      return
    }

    const base = {
      nome,
      email,
      matricula,
      departamento,
      cargaHorariaSemanal: parseInt(cargaHoraria, 10),
      senha,
      dataInicioContrato: dataInicioContrato || null,
      dataFimContrato: dataFimContrato || null,
      mustChangePassword: true,
    }

    if (novoCargoCadastro === 'gestor') {
      addUsuario({
        ...base,
        cargo: 'gestor',
        dataInicioRecesso1: null,
        dataFimRecesso1: null,
        dataInicioRecesso2: null,
        dataFimRecesso2: null,
      })
      toast.success(`Gestor ${nome} cadastrado com sucesso!`)
    } else {
      const gestorIdsExtra = extraGestorIds.filter((id) => id !== '_none')
      addUsuario({
        ...base,
        cargo: 'estagiario',
        dataInicioRecesso1: dataInicioRecesso1 || null,
        dataFimRecesso1: dataFimRecesso1 || null,
        dataInicioRecesso2: dataInicioRecesso2 || null,
        dataFimRecesso2: dataFimRecesso2 || null,
        gestorId: novoGestorId === '_none' ? null : novoGestorId,
        gestorIds: gestorIdsExtra.length > 0 ? gestorIdsExtra : undefined,
      })
      toast.success(`Estagiário ${nome} cadastrado com sucesso!`)
    }

    resetNovoUsuarioForm()
    setIsDialogOpen(false)
  }

  const handleSetRecesso = (
    userId: string,
    inicio: string,
    fim: string,
    numero: 1 | 2,
  ) => {
    if (!validateDateRange(inicio, fim, `Recesso ${numero}`)) return

    const patch: Parameters<typeof updateUsuario>[1] =
      numero === 1
        ? { dataInicioRecesso1: inicio, dataFimRecesso1: fim }
        : { dataInicioRecesso2: inicio, dataFimRecesso2: fim }

    updateUsuario(userId, patch)
    toast.success('Recesso agendado com sucesso!')
  }

  const openUserActions = (userId: string) => {
    const usuario = usuarios.find((u) => u.id === userId)
    if (!usuario) return

    setSelectedUserId(usuario.id)
    setNome(usuario.nome)
    setEmail(usuario.email)
    setMatricula(usuario.matricula)
    setDepartamento(usuario.departamento)
    setCargaHoraria(String(usuario.cargaHorariaSemanal))
    setDataInicioContrato(usuario.dataInicioContrato || '')
    setDataFimContrato(usuario.dataFimContrato || '')
    setDataInicioRecesso1(usuario.dataInicioRecesso1 || '')
    setDataFimRecesso1(usuario.dataFimRecesso1 || '')
    setDataInicioRecesso2(usuario.dataInicioRecesso2 || '')
    setDataFimRecesso2(usuario.dataFimRecesso2 || '')
    setGestorVinculoId(usuario.cargo === 'estagiario' ? (usuario.gestorId ?? '_none') : '_none')
    const principal = usuario.gestorId
    const extras = (usuario.gestorIds ?? []).filter((id) => id !== principal)
    setEditExtraGestorIds(extras.length > 0 ? extras : [])
    setIsEditMode(false)
    setIsActionDialogOpen(true)
  }

  const handleUpdateSelectedUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    if (!nome || !email || !matricula || !departamento || !cargaHoraria) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const emailDuplicado = usuarios.some(
      (u) => u.id !== selectedUser.id && u.email.toLowerCase() === email.toLowerCase(),
    )
    if (emailDuplicado) {
      toast.error('Este email já está cadastrado')
      return
    }

    const matriculaDuplicada = usuarios.some(
      (u) => u.id !== selectedUser.id && u.matricula.toLowerCase() === matricula.toLowerCase(),
    )
    if (matriculaDuplicada) {
      toast.error('Esta matrícula já está cadastrada')
      return
    }

    if (!validateDateRange(dataInicioContrato, dataFimContrato, 'Contrato')) return
    if (!validateDateRange(dataInicioRecesso1, dataFimRecesso1, 'Recesso 1')) return
    if (!validateDateRange(dataInicioRecesso2, dataFimRecesso2, 'Recesso 2')) return

    if (selectedUser.cargo === 'estagiario' && gestorVinculoId === '_none') {
      toast.error('Selecione o gestor principal do estagiário')
      return
    }

    const patch: Parameters<typeof updateUsuario>[1] = {
      nome,
      matricula,
      departamento,
      cargaHorariaSemanal: parseInt(cargaHoraria, 10),
      dataInicioContrato: dataInicioContrato || null,
      dataFimContrato: dataFimContrato || null,
    }

    if (selectedUser.cargo === 'estagiario') {
      patch.dataInicioRecesso1 = dataInicioRecesso1 || null
      patch.dataFimRecesso1 = dataFimRecesso1 || null
      patch.dataInicioRecesso2 = dataInicioRecesso2 || null
      patch.dataFimRecesso2 = dataFimRecesso2 || null
      patch.gestorId = gestorVinculoId === '_none' ? null : gestorVinculoId
      const gestorIdsExtra = editExtraGestorIds.filter((id) => id !== '_none')
      patch.gestorIds = gestorIdsExtra
    }

    if (selectedUser.cargo === 'gestor') {
      patch.dataInicioRecesso1 = null
      patch.dataFimRecesso1 = null
      patch.dataInicioRecesso2 = null
      patch.dataFimRecesso2 = null
    }

    updateUsuario(selectedUser.id, patch)

    toast.success('Usuário atualizado com sucesso!')
    setIsEditMode(false)
  }

  const handleDeleteSelectedUser = () => {
    if (!selectedUser) return
    deleteUsuario(selectedUser.id)
    toast.success('Usuário excluído com sucesso!')
    setIsActionDialogOpen(false)
    setSelectedUserId(null)
    setIsEditMode(false)
  }

  const renderRecessoCell = (u: User) => {
    const emRecesso = isUserInRecessPeriod(today, u)
    const recessoProximo = !emRecesso && isAnyRecessApproaching(u)

    if (emRecesso) {
      const emR1 = isInRecessPeriod(today, u.dataInicioRecesso1, u.dataFimRecesso1)
      const fim = emR1 ? u.dataFimRecesso1 : u.dataFimRecesso2
      const num = emR1 ? 1 : 2
      return (
        <Badge className="bg-blue-100 text-blue-800">
          Recesso {num} até {fim && formatDate(fim)}
        </Badge>
      )
    }

    if (recessoProximo) {
      const proxR1 = isRecessApproaching(u.dataInicioRecesso1)
      const inicio = proxR1 ? u.dataInicioRecesso1 : u.dataInicioRecesso2
      const num = proxR1 ? 1 : 2
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-600">
          Recesso {num} inicia em {inicio && formatDate(inicio)}
        </Badge>
      )
    }

    const temRecesso =
      u.dataInicioRecesso1 || u.dataInicioRecesso2

    if (temRecesso) {
      const partes: string[] = []
      if (u.dataInicioRecesso1) {
        partes.push(
          `R1: ${formatDate(u.dataInicioRecesso1)}${u.dataFimRecesso1 ? ` – ${formatDate(u.dataFimRecesso1)}` : ''}`,
        )
      }
      if (u.dataInicioRecesso2) {
        partes.push(
          `R2: ${formatDate(u.dataInicioRecesso2)}${u.dataFimRecesso2 ? ` – ${formatDate(u.dataFimRecesso2)}` : ''}`,
        )
      }
      return <span className="text-sm text-muted-foreground">{partes.join(' · ')}</span>
    }

    const recessoAlvo: 1 | 2 = 1

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            Agendar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Recesso</DialogTitle>
            <DialogDescription>Defina o período de recesso de {u.nome}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const inicio = formData.get('inicio') as string
              const fim = formData.get('fim') as string
              if (inicio && fim) {
                handleSetRecesso(u.id, inicio, fim, recessoAlvo)
              }
            }}
            className="space-y-4"
          >
            <Field>
              <FieldLabel htmlFor={`recesso-inicio-${u.id}`}>Data de Início</FieldLabel>
              <Input id={`recesso-inicio-${u.id}`} name="inicio" type="date" required />
            </Field>
            <Field>
              <FieldLabel htmlFor={`recesso-fim-${u.id}`}>Data de Fim</FieldLabel>
              <Input id={`recesso-fim-${u.id}`} name="fim" type="date" required />
            </Field>
            <Button type="submit" className="w-full">
              Confirmar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  const renderGestorSelectors = (
    primary: string,
    setPrimary: (v: string) => void,
    extras: string[],
    setExtras: (v: string[]) => void,
    selectedIds: string[],
    idPrefix: string,
  ) => (
    <div className="space-y-3 sm:col-span-2">
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-gestor-principal`}>Gestor principal</FieldLabel>
        <Select value={primary} onValueChange={setPrimary} required>
          <SelectTrigger id={`${idPrefix}-gestor-principal`}>
            <SelectValue placeholder="Selecione o gestor" />
          </SelectTrigger>
          <SelectContent>
            {getGestoresDisponiveis(gestoresLista, selectedIds, primary).map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {extras.map((extraId, idx) => (
        <Field key={`${idPrefix}-extra-${idx}`}>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FieldLabel htmlFor={`${idPrefix}-gestor-extra-${idx}`}>Gestor adicional</FieldLabel>
              <Select
                value={extraId}
                onValueChange={(v) => {
                  const next = [...extras]
                  next[idx] = v
                  setExtras(next)
                }}
              >
                <SelectTrigger id={`${idPrefix}-gestor-extra-${idx}`}>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {getGestoresDisponiveis(gestoresLista, selectedIds, extraId).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setExtras(extras.filter((_, i) => i !== idx))}
              aria-label="Remover gestor adicional"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Field>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setExtras([...extras, '_none'])}
        disabled={getGestoresDisponiveis(gestoresLista, selectedIds, '_none').length === 0}
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar gestor
      </Button>
    </div>
  )

  const renderContratoFields = (idPrefix: string) => (
    <>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-contrato-inicio`}>Início do contrato</FieldLabel>
        <Input
          id={`${idPrefix}-contrato-inicio`}
          type="date"
          value={dataInicioContrato}
          onChange={(e) => setDataInicioContrato(e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-contrato-fim`}>Fim do contrato</FieldLabel>
        <Input
          id={`${idPrefix}-contrato-fim`}
          type="date"
          value={dataFimContrato}
          onChange={(e) => setDataFimContrato(e.target.value)}
        />
      </Field>
    </>
  )

  const renderRecessoFields = (idPrefix: string) => (
    <>
      <Field className="sm:col-span-2">
        <p className="text-sm font-medium mb-2">Recesso 1</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-recesso1-inicio`}>Início</FieldLabel>
            <Input
              id={`${idPrefix}-recesso1-inicio`}
              type="date"
              value={dataInicioRecesso1}
              onChange={(e) => setDataInicioRecesso1(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-recesso1-fim`}>Fim</FieldLabel>
            <Input
              id={`${idPrefix}-recesso1-fim`}
              type="date"
              value={dataFimRecesso1}
              onChange={(e) => setDataFimRecesso1(e.target.value)}
            />
          </Field>
        </div>
      </Field>
      <Field className="sm:col-span-2">
        <p className="text-sm font-medium mb-2">Recesso 2</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-recesso2-inicio`}>Início</FieldLabel>
            <Input
              id={`${idPrefix}-recesso2-inicio`}
              type="date"
              value={dataInicioRecesso2}
              onChange={(e) => setDataInicioRecesso2(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-recesso2-fim`}>Fim</FieldLabel>
            <Input
              id={`${idPrefix}-recesso2-fim`}
              type="date"
              value={dataFimRecesso2}
              onChange={(e) => setDataFimRecesso2(e.target.value)}
            />
          </Field>
        </div>
      </Field>
    </>
  )

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Gestão de Usuários</h1>
      </header>

      <main data-fy-anchor="fy-admin-usuarios-main" className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Usuários</h2>
            <p className="text-muted-foreground">Estagiários, gestores e vínculos entre eles</p>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetNovoUsuarioForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar usuário</DialogTitle>
                <DialogDescription>Estagiário (com gestor obrigatório) ou gestor</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="tipo-cadastro">Tipo</FieldLabel>
                    <Select
                      value={novoCargoCadastro}
                      onValueChange={(v) => {
                        setNovoCargoCadastro(v as 'estagiario' | 'gestor')
                        if (v === 'gestor') {
                          setDataInicioRecesso1('')
                          setDataFimRecesso1('')
                          setDataInicioRecesso2('')
                          setDataFimRecesso2('')
                          setNovoGestorId('_none')
                          setExtraGestorIds([])
                        }
                      }}
                    >
                      <SelectTrigger id="tipo-cadastro">
                        <SelectValue placeholder="Tipo de usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="estagiario">Estagiário</SelectItem>
                        <SelectItem value="gestor">Gestor</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="nome">Nome Completo</FieldLabel>
                    <Input
                      id="nome"
                      placeholder="Nome do estagiário"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="matricula">Matrícula</FieldLabel>
                    <Input
                      id="matricula"
                      placeholder="EST001"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="departamento">Departamento</FieldLabel>
                    <Select value={departamento} onValueChange={setDepartamento}>
                      <SelectTrigger id="departamento">
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTAMENTOS.map((dep) => (
                          <SelectItem key={dep} value={dep}>
                            {dep}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field className={novoCargoCadastro === 'gestor' ? 'sm:col-span-2' : undefined}>
                    <FieldLabel htmlFor="cargaHoraria">Carga Horária Semanal</FieldLabel>
                    <Select value={cargaHoraria} onValueChange={setCargaHoraria}>
                      <SelectTrigger id="cargaHoraria">
                        <SelectValue placeholder="Selecione a carga horária" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARGAS_HORARIAS.map((ch) => (
                          <SelectItem key={ch.value} value={ch.value}>
                            {ch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {renderContratoFields('novo')}

                  <Field>
                    <FieldLabel htmlFor="senha">Senha</FieldLabel>
                    <Input
                      id="senha"
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      minLength={6}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmSenha">Confirmar senha</FieldLabel>
                    <Input
                      id="confirmSenha"
                      type="password"
                      value={confirmSenha}
                      onChange={(e) => setConfirmSenha(e.target.value)}
                      minLength={6}
                      required
                    />
                  </Field>

                  {novoCargoCadastro === 'estagiario' ? (
                    <>
                      {renderGestorSelectors(
                        novoGestorId,
                        setNovoGestorId,
                        extraGestorIds,
                        setExtraGestorIds,
                        createSelectedGestorIds(),
                        'novo',
                      )}
                      {renderRecessoFields('novo')}
                    </>
                  ) : null}
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {novoCargoCadastro === 'gestor'
                      ? 'Gestores acompanham estagiários vinculados no painel Meus estagiários.'
                      : 'O gestor principal é obrigatório. Você pode adicionar gestores extras se necessário.'}
                  </AlertDescription>
                </Alert>

                <Button type="submit" className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {novoCargoCadastro === 'gestor' ? 'Cadastrar gestor' : 'Cadastrar estagiário'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Estagiários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estagiarios.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gestores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gestoresLista.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Em Recesso</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estagiarios.filter((u) => isUserInRecessPeriod(today, u)).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recesso Próximo</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estagiarios.filter((u) => isAnyRecessApproaching(u)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Estagiários</CardTitle>
            <CardDescription>Todos os estagiários cadastrados no sistema</CardDescription>
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
                  placeholder="Buscar por nome ou matrícula"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>

            {estagiariosFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Carga Horária</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Gestor(es)</TableHead>
                      <TableHead>Recesso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estagiariosFiltrados.map((u) => {
                      const bancoHoras = getBancoHoras(u.id)
                      const gestorNome = getGestorNomes(u, usuarios)

                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            <button
                              type="button"
                              onClick={() => openUserActions(u.id)}
                              className="text-primary hover:underline"
                            >
                              {u.nome}
                            </button>
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.matricula}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.departamento}</Badge>
                          </TableCell>
                          <TableCell>{formatMinutesToDisplay(u.cargaHorariaSemanal)}/sem</TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${bancoHoras >= 0 ? 'text-green-600' : 'text-destructive'}`}
                            >
                              {formatMinutesToDisplay(bancoHoras)}
                            </span>
                          </TableCell>
                          <TableCell
                            className="text-sm text-muted-foreground max-w-[160px] truncate"
                            title={gestorNome}
                          >
                            {gestorNome}
                          </TableCell>
                          <TableCell>{renderRecessoCell(u)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum estagiário encontrado no filtro atual. Clique em &quot;Novo Usuário&quot; para adicionar.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Lista de gestores</CardTitle>
            <CardDescription>Quem pode acompanhar estagiários vinculados</CardDescription>
          </CardHeader>
          <CardContent>
            {gestoresLista.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum gestor cadastrado. Use &quot;Novo usuário&quot; e escolha o tipo Gestor.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Carga</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gestoresLista.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">
                          <button
                            type="button"
                            onClick={() => openUserActions(g.id)}
                            className="text-primary hover:underline text-left"
                          >
                            {g.nome}
                          </button>
                        </TableCell>
                        <TableCell>{g.email}</TableCell>
                        <TableCell>{g.matricula}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{g.departamento}</Badge>
                        </TableCell>
                        <TableCell>{formatMinutesToDisplay(g.cargaHorariaSemanal)}/sem</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? `Ações de ${selectedUser.nome}` : 'Ações do usuário'}
              </DialogTitle>
              <DialogDescription>
                {selectedUser?.cargo === 'estagiario'
                  ? 'Histórico, edição e exclusão do estagiário.'
                  : 'Edição e exclusão do perfil do gestor.'}
              </DialogDescription>
            </DialogHeader>

            {!isEditMode ? (
              <div className="space-y-3">
                {selectedUser?.cargo === 'estagiario' ? (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      if (!selectedUser) return
                      setIsActionDialogOpen(false)
                      router.push(`/dashboard/historico?userId=${selectedUser.id}`)
                    }}
                  >
                    Visualizar Histórico
                  </Button>
                ) : null}
                <Button type="button" variant="outline" className="w-full" onClick={() => setIsEditMode(true)}>
                  Editar Usuário
                </Button>
                <Button type="button" variant="destructive" className="w-full" onClick={handleDeleteSelectedUser}>
                  Excluir Usuário
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUpdateSelectedUser} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="edit-nome">Nome Completo</FieldLabel>
                    <Input id="edit-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-email">Email</FieldLabel>
                    <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-matricula">Matrícula</FieldLabel>
                    <Input
                      id="edit-matricula"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-departamento">Departamento</FieldLabel>
                    <Select value={departamento} onValueChange={setDepartamento}>
                      <SelectTrigger id="edit-departamento">
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTAMENTOS.map((dep) => (
                          <SelectItem key={dep} value={dep}>
                            {dep}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-carga">Carga Horária Semanal</FieldLabel>
                    <Select value={cargaHoraria} onValueChange={setCargaHoraria}>
                      <SelectTrigger id="edit-carga">
                        <SelectValue placeholder="Selecione a carga horária" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARGAS_HORARIAS.map((ch) => (
                          <SelectItem key={ch.value} value={ch.value}>
                            {ch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="edit-contrato-inicio">Início do contrato</FieldLabel>
                      <Input
                        id="edit-contrato-inicio"
                        type="date"
                        value={dataInicioContrato}
                        onChange={(e) => setDataInicioContrato(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-contrato-fim">Fim do contrato</FieldLabel>
                      <Input
                        id="edit-contrato-fim"
                        type="date"
                        value={dataFimContrato}
                        onChange={(e) => setDataFimContrato(e.target.value)}
                      />
                    </Field>
                  </div>

                  {selectedUser != null && selectedUser.cargo === 'estagiario' ? (
                    <>
                      {renderGestorSelectors(
                        gestorVinculoId,
                        setGestorVinculoId,
                        editExtraGestorIds,
                        setEditExtraGestorIds,
                        editSelectedGestorIds(),
                        'edit',
                      )}
                      {renderRecessoFields('edit')}
                    </>
                  ) : null}
                </FieldGroup>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditMode(false)}>
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
