'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { formatDate, formatMinutesToDisplay, getTodayString } from '@/lib/time-utils'
import { LABELS } from '@/lib/labels'
import {
  STATUS_COMPENSACAO_LABELS,
  effectiveStatusCompensacao,
} from '@/lib/compensacao-utils'
import { FileText, Clock, Send, Info } from 'lucide-react'
import { uploadJustificativaArquivoAction } from '@/app/actions/justificativas'

export default function JustificativasPage() {
  const { user } = useAuth()
  const { addJustificativa, getJustificativasByUser, getBancoHoras } = useData()

  const justificativas = user ? getJustificativasByUser(user.id) : []
  const bancoHoras = user ? getBancoHoras(user.id) : 0

  // Estados para formulário de atestado
  const [atestadoData, setAtestadoData] = useState('')
  const [atestadoDescricao, setAtestadoDescricao] = useState('')
  const [atestadoArquivo, setAtestadoArquivo] = useState<File | null>(null)

  // Estados para formulário de compensação
  const [compDataFalta, setCompDataFalta] = useState('')
  const [compDescricao, setCompDescricao] = useState('')

  const handleAtestadoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (!atestadoData) {
      toast.error('Selecione a data do atestado')
      return
    }

    if (!atestadoDescricao.trim()) {
      toast.error('Descreva o motivo do atestado')
      return
    }

    let arquivoPath: string | null = null
    if (atestadoArquivo) {
      const formData = new FormData()
      formData.append('file', atestadoArquivo)
      const upload = await uploadJustificativaArquivoAction(formData)
      if (!upload.success) {
        toast.error(upload.error)
        return
      }
      arquivoPath = upload.data.path
    }

    const result = await addJustificativa({
      userId: user.id,
      data: atestadoData,
      tipo: 'atestado',
      descricao: atestadoDescricao,
      arquivoUrl: arquivoPath,
      minutosAbatidos: 0,
    })

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Atestado enviado com sucesso!')

    setAtestadoData('')
    setAtestadoDescricao('')
    setAtestadoArquivo(null)
  }

  const handleCompensacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (!compDataFalta) {
      toast.error('Selecione a data da falta para compensação')
      return
    }

    if (!compDescricao.trim()) {
      toast.error('Descreva o motivo da compensação')
      return
    }

    const result = await addJustificativa({
      userId: user.id,
      data: compDataFalta,
      tipo: 'compensacao',
      descricao: compDescricao.trim(),
      arquivoUrl: null,
      minutosAbatidos: 0,
    })

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Solicitação de compensação enviada ao gestor para aprovação.')

    setCompDataFalta('')
    setCompDescricao('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAtestadoArquivo(file)
    }
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Justificativas</h1>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Justificativas e Compensações
          </h2>
          <p className="text-muted-foreground">
            Envie atestados ou registre compensações de horas
          </p>
        </div>

        {/* Card de Banco de Horas */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{LABELS.SEU_SALDO}</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${bancoHoras >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatMinutesToDisplay(bancoHoras)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {bancoHoras >= 0 
                ? 'Saldo positivo' 
                : `Você deve ${formatMinutesToDisplay(Math.abs(bancoHoras))} de trabalho`
              }
            </p>
          </CardContent>
        </Card>

        <div data-fy-anchor="fy-justificativas-panel" className="space-y-6">
        <Tabs defaultValue="atestado" className="max-w-2xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="atestado">
              <FileText className="mr-2 h-4 w-4" />
              Atestado
            </TabsTrigger>
            <TabsTrigger value="compensacao">
              <Clock className="mr-2 h-4 w-4" />
              Compensação
            </TabsTrigger>
          </TabsList>

          {/* Tab Atestado */}
          <TabsContent value="atestado">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Atestado</CardTitle>
                <CardDescription>
                  Justifique uma falta anexando um atestado médico ou documento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    O atestado será enviado automaticamente para o RH por email para validação.
                    Faltas justificadas não geram débito no saldo.
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleAtestadoSubmit} className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="atestado-data">{LABELS.DATA_AUSENCIA}</FieldLabel>
                      <Input
                        id="atestado-data"
                        type="date"
                        value={atestadoData}
                        onChange={(e) => setAtestadoData(e.target.value)}
                        max={getTodayString()}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="atestado-descricao">Descrição</FieldLabel>
                      <Textarea
                        id="atestado-descricao"
                        placeholder="Descreva o motivo da falta..."
                        value={atestadoDescricao}
                        onChange={(e) => setAtestadoDescricao(e.target.value)}
                        rows={3}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="atestado-arquivo">Anexar Arquivo</FieldLabel>
                      <div className="flex items-center gap-2">
                        <Input
                          id="atestado-arquivo"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="flex-1"
                        />
                      </div>
                      {atestadoArquivo && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Arquivo selecionado: {atestadoArquivo.name}
                        </p>
                      )}
                    </Field>
                  </FieldGroup>

                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Atestado
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Compensação */}
          <TabsContent value="compensacao">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Compensação</CardTitle>
                <CardDescription>
                  A compensação precisa ser aprovada pelo gestor antes de impactar o saldo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Após aprovação do gestor, <strong>6h</strong> serão debitadas do saldo e a solicitação
                    ficará visível para o RH (administrador).
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleCompensacaoSubmit} className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="comp-data-falta">{LABELS.DATA_AUSENCIA}</FieldLabel>
                      <Input
                        id="comp-data-falta"
                        type="date"
                        value={compDataFalta}
                        onChange={(e) => setCompDataFalta(e.target.value)}
                        max={getTodayString()}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="comp-descricao">Descrição da justificativa</FieldLabel>
                      <Textarea
                        id="comp-descricao"
                        placeholder="Descreva a situação da falta para compensação..."
                        value={compDescricao}
                        onChange={(e) => setCompDescricao(e.target.value)}
                        rows={3}
                        required
                      />
                    </Field>
                  </FieldGroup>

                  <Button type="submit" className="w-full">
                    <Clock className="mr-2 h-4 w-4" />
                    Solicitar compensação ao gestor
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Histórico de Justificativas e Compensações */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Histórico de Justificativas e Compensações</CardTitle>
            <CardDescription>
              Acompanhe o histórico completo de atestados e compensações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {justificativas.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {justificativas.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell className="font-medium">
                          {formatDate(j.data)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={j.tipo === 'atestado' ? 'secondary' : 'default'}>
                            {j.tipo === 'atestado' ? 'Atestado' : 'Compensação'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {j.tipo === 'compensacao' && effectiveStatusCompensacao(j) ? (
                            <Badge
                              variant={
                                effectiveStatusCompensacao(j) === 'aprovada_gestor'
                                  ? 'default'
                                  : effectiveStatusCompensacao(j) === 'rejeitada_gestor'
                                    ? 'destructive'
                                    : 'outline'
                              }
                            >
                              {STATUS_COMPENSACAO_LABELS[effectiveStatusCompensacao(j)!]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {j.descricao}
                        </TableCell>
                        <TableCell>
                          {j.arquivoUrl ? (
                            <a 
                              href={j.arquivoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm"
                            >
                              Ver arquivo
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {j.minutosAbatidos !== 0 ? (
                            <span className={`font-medium ${j.minutosAbatidos > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {j.minutosAbatidos > 0 ? '+' : '-'}
                              {formatMinutesToDisplay(Math.abs(j.minutosAbatidos))}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma justificativa registrada
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
    </>
  )
}
