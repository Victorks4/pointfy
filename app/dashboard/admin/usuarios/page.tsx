'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { useRouter } from 'next/navigation'
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
import { formatDate, formatMinutesToDisplay, calculateRecessEnd, isRecessApproaching } from '@/lib/time-utils'
import { DIAS_RECESSO } from '@/lib/types'
import { UserPlus, Users, Calendar, Info, AlertCircle } from 'lucide-react'

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
]

export default function UsuariosAdminPage() {
  const { user } = useAuth()
  const { usuarios, addUsuario, updateUsuario, deleteUsuario, getBancoHoras, addNotificacao } = useData()
  const router = useRouter()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  // Estados do formulário
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [ra, setRa] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [cargaHoraria, setCargaHoraria] = useState('')
  const [dataRecesso, setDataRecesso] = useState('')

  const selectedUser = selectedUserId ? usuarios.find((u) => u.id === selectedUserId) ?? null : null

  // Verificar se é admin
  useEffect(() => {
    if (user && user.cargo !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  // Verificar recessos próximos e criar notificações
  useEffect(() => {
    usuarios
      .filter(u => u.cargo === 'estagiario' && isRecessApproaching(u.dataInicioRecesso))
      .forEach(u => {
        // Em um sistema real, verificaria se já existe notificação
        console.log(`[v0] Recesso próximo para usuário ${u.nome}`)
      })
  }, [usuarios])

  if (user?.cargo !== 'admin') {
    return null
  }

  const estagiarios = usuarios.filter(u => u.cargo === 'estagiario')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome || !email || !ra || !departamento || !cargaHoraria) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Verificar se email ou RA já existem
    if (usuarios.some(u => u.email === email)) {
      toast.error('Este email já está cadastrado')
      return
    }

    if (usuarios.some(u => u.ra === ra)) {
      toast.error('Este RA já está cadastrado')
      return
    }

    const dataFimRecesso = dataRecesso ? calculateRecessEnd(dataRecesso) : null

    addUsuario({
      nome,
      email,
      ra,
      cargo: 'estagiario',
      departamento,
      cargaHorariaSemanal: parseInt(cargaHoraria),
      dataInicioRecesso: dataRecesso || null,
      dataFimRecesso,
    })

    // Se tem recesso programado, criar notificação para o usuário
    if (dataRecesso) {
      // Em um sistema real, isso seria feito quando o usuário for criado no banco
      console.log(`[v0] Recesso programado: ${dataRecesso} a ${dataFimRecesso}`)
    }

    toast.success(`Usuário ${nome} cadastrado com sucesso!`)

    // Limpar formulário
    setNome('')
    setEmail('')
    setRa('')
    setDepartamento('')
    setCargaHoraria('')
    setDataRecesso('')
    setIsDialogOpen(false)
  }

  const handleSetRecesso = (userId: string, dataInicio: string) => {
    const dataFim = calculateRecessEnd(dataInicio)
    updateUsuario(userId, {
      dataInicioRecesso: dataInicio,
      dataFimRecesso: dataFim,
    })

    // Criar notificação para o usuário
    addNotificacao({
      userId,
      titulo: 'Recesso Remunerado Agendado',
      mensagem: `Seu recesso remunerado foi agendado para ${formatDate(dataInicio)} até ${formatDate(dataFim)}. Durante este período, você não precisará registrar ponto.`,
      lida: false,
    })

    toast.success('Recesso agendado com sucesso!')
  }

  const openUserActions = (userId: string) => {
    const usuario = usuarios.find((u) => u.id === userId)
    if (!usuario) return

    setSelectedUserId(usuario.id)
    setNome(usuario.nome)
    setEmail(usuario.email)
    setRa(usuario.ra)
    setDepartamento(usuario.departamento)
    setCargaHoraria(String(usuario.cargaHorariaSemanal))
    setDataRecesso(usuario.dataInicioRecesso || '')
    setIsEditMode(false)
    setIsActionDialogOpen(true)
  }

  const handleUpdateSelectedUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    if (!nome || !email || !ra || !departamento || !cargaHoraria) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const emailDuplicado = usuarios.some(
      (u) => u.id !== selectedUser.id && u.email.toLowerCase() === email.toLowerCase()
    )
    if (emailDuplicado) {
      toast.error('Este email já está cadastrado')
      return
    }

    const raDuplicado = usuarios.some((u) => u.id !== selectedUser.id && u.ra.toLowerCase() === ra.toLowerCase())
    if (raDuplicado) {
      toast.error('Este RA já está cadastrado')
      return
    }

    const dataFimRecesso = dataRecesso ? calculateRecessEnd(dataRecesso) : null

    updateUsuario(selectedUser.id, {
      nome,
      email,
      ra,
      departamento,
      cargaHorariaSemanal: parseInt(cargaHoraria),
      dataInicioRecesso: dataRecesso || null,
      dataFimRecesso,
    })

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

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Gestão de Usuários</h1>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Usuários
            </h2>
            <p className="text-muted-foreground">
              Gerencie os estagiários do sistema
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Estagiário</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo estagiário
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <FieldGroup>
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
                    <FieldLabel htmlFor="ra">RA (Registro Acadêmico)</FieldLabel>
                    <Input
                      id="ra"
                      placeholder="EST001"
                      value={ra}
                      onChange={(e) => setRa(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="departamento">Departamento</FieldLabel>
                    <Select value={departamento} onValueChange={setDepartamento}>
                      <SelectTrigger>
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
                    <FieldLabel htmlFor="cargaHoraria">Carga Horária Semanal</FieldLabel>
                    <Select value={cargaHoraria} onValueChange={setCargaHoraria}>
                      <SelectTrigger>
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

                  <Field>
                    <FieldLabel htmlFor="dataRecesso">Data do Recesso Remunerado (Opcional)</FieldLabel>
                    <Input
                      id="dataRecesso"
                      type="date"
                      value={dataRecesso}
                      onChange={(e) => setDataRecesso(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      O recesso terá duração de {DIAS_RECESSO} dias a partir desta data
                    </p>
                  </Field>
                </FieldGroup>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    O cargo será definido como Estagiário. Outros cargos serão implementados futuramente.
                  </AlertDescription>
                </Alert>

                <Button type="submit" className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Estagiário
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Estagiários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estagiarios.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Em Recesso</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estagiarios.filter(u => u.dataInicioRecesso && new Date(u.dataInicioRecesso) <= new Date() && new Date(u.dataFimRecesso || '') >= new Date()).length}
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
                {estagiarios.filter(u => isRecessApproaching(u.dataInicioRecesso)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Estagiários</CardTitle>
            <CardDescription>
              Todos os estagiários cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estagiarios.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>RA</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Carga Horária</TableHead>
                      <TableHead>Banco de Horas</TableHead>
                      <TableHead>Recesso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estagiarios.map((u) => {
                      const bancoHoras = getBancoHoras(u.id)
                      const emRecesso = u.dataInicioRecesso && new Date(u.dataInicioRecesso) <= new Date() && new Date(u.dataFimRecesso || '') >= new Date()
                      const recessoProximo = isRecessApproaching(u.dataInicioRecesso)

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
                          <TableCell>{u.ra}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.departamento}</Badge>
                          </TableCell>
                          <TableCell>
                            {formatMinutesToDisplay(u.cargaHorariaSemanal)}/sem
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${bancoHoras >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                              {formatMinutesToDisplay(bancoHoras)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {emRecesso ? (
                              <Badge className="bg-blue-100 text-blue-800">
                                Em recesso até {u.dataFimRecesso && formatDate(u.dataFimRecesso)}
                              </Badge>
                            ) : recessoProximo ? (
                              <Badge variant="outline" className="border-amber-500 text-amber-600">
                                Inicia em {u.dataInicioRecesso && formatDate(u.dataInicioRecesso)}
                              </Badge>
                            ) : u.dataInicioRecesso ? (
                              <span className="text-sm text-muted-foreground">
                                {formatDate(u.dataInicioRecesso)}
                              </span>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Agendar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Agendar Recesso</DialogTitle>
                                    <DialogDescription>
                                      Defina a data de início do recesso de {u.nome}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault()
                                      const formData = new FormData(e.currentTarget)
                                      const data = formData.get('dataRecesso') as string
                                      if (data) {
                                        handleSetRecesso(u.id, data)
                                      }
                                    }}
                                    className="space-y-4"
                                  >
                                    <Field>
                                      <FieldLabel htmlFor={`recesso-${u.id}`}>
                                        Data de Início
                                      </FieldLabel>
                                      <Input
                                        id={`recesso-${u.id}`}
                                        name="dataRecesso"
                                        type="date"
                                        required
                                      />
                                    </Field>
                                    <p className="text-sm text-muted-foreground">
                                      O recesso terá duração de {DIAS_RECESSO} dias
                                    </p>
                                    <Button type="submit" className="w-full">
                                      Confirmar
                                    </Button>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum estagiário cadastrado. Clique em &quot;Novo Usuário&quot; para adicionar.
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? `Ações de ${selectedUser.nome}` : 'Ações do usuário'}
              </DialogTitle>
              <DialogDescription>
                Visualize histórico, edite informações ou exclua o perfil do estagiário.
              </DialogDescription>
            </DialogHeader>

            {!isEditMode ? (
              <div className="space-y-3">
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
                    <FieldLabel htmlFor="edit-ra">RA</FieldLabel>
                    <Input id="edit-ra" value={ra} onChange={(e) => setRa(e.target.value)} required />
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
                  <Field>
                    <FieldLabel htmlFor="edit-recesso">Data do Recesso</FieldLabel>
                    <Input
                      id="edit-recesso"
                      type="date"
                      value={dataRecesso}
                      onChange={(e) => setDataRecesso(e.target.value)}
                    />
                  </Field>
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
