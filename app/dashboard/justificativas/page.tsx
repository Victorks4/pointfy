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
import { MINUTOS_COMPENSACAO } from '@/lib/types'
import { FileText, Upload, Clock, Send, Info, AlertCircle } from 'lucide-react'

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
  const [compDescricao, setCompDescricao] = useState('')

  // Verificar se o texto é "COMP", "comp", "compensado" ou "Compensado"
  const isCompensacao = (text: string): boolean => {
    const normalized = text.trim().toLowerCase()
    return ['comp', 'compensado'].includes(normalized)
  }

  const handleAtestadoSubmit = (e: React.FormEvent) => {
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

    // Simular envio de email para RH
    console.log('[v0] Simulando envio de email para RH com atestado')
    
    addJustificativa({
      userId: user.id,
      data: atestadoData,
      tipo: 'atestado',
      descricao: atestadoDescricao,
      arquivoUrl: atestadoArquivo ? URL.createObjectURL(atestadoArquivo) : null,
      minutosAbatidos: 0, // Atestado não abate horas, apenas justifica falta
    })

    toast.success('Atestado enviado com sucesso! O RH será notificado por email.')

    // Limpar formulário
    setAtestadoData('')
    setAtestadoDescricao('')
    setAtestadoArquivo(null)
  }

  const handleCompensacaoSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (!compDescricao.trim()) {
      toast.error('Digite COMP, comp, compensado ou Compensado para registrar')
      return
    }

    if (!isCompensacao(compDescricao)) {
      toast.error('Para compensar, digite: COMP, comp, compensado ou Compensado')
      return
    }

    // Verificar se há saldo negativo para compensar
    if (bancoHoras >= 0) {
      toast.info('Você não tem horas negativas para compensar')
      return
    }

    addJustificativa({
      userId: user.id,
      data: getTodayString(),
      tipo: 'compensacao',
      descricao: 'Compensação de horas',
      arquivoUrl: null,
      minutosAbatidos: MINUTOS_COMPENSACAO, // 6h = 360 minutos
    })

    toast.success(`Compensação registrada! ${formatMinutesToDisplay(MINUTOS_COMPENSACAO)} retiradas do seu débito.`)

    // Limpar formulário
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
            <CardTitle className="text-lg">Seu Banco de Horas</CardTitle>
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
                    Faltas justificadas não geram débito no banco de horas.
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleAtestadoSubmit} className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="atestado-data">Data da Falta</FieldLabel>
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
                  Compense horas devidas retirando 6h do seu débito no banco de horas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Para registrar uma compensação, digite <strong>COMP</strong>, <strong>comp</strong>, <strong>compensado</strong> ou <strong>Compensado</strong> no campo abaixo.
                    Cada compensação retira 6h do seu saldo negativo.
                  </AlertDescription>
                </Alert>

                {bancoHoras >= 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você não possui horas negativas para compensar. Seu saldo atual é positivo.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleCompensacaoSubmit} className="space-y-4">
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="comp-descricao">
                          Digite para confirmar a compensação
                        </FieldLabel>
                        <Input
                          id="comp-descricao"
                          placeholder="COMP ou compensado"
                          value={compDescricao}
                          onChange={(e) => setCompDescricao(e.target.value)}
                        />
                      </Field>
                    </FieldGroup>

                    <Button type="submit" className="w-full">
                      <Clock className="mr-2 h-4 w-4" />
                      Registrar Compensação (-6h do débito)
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Histórico de Justificativas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Histórico de Justificativas</CardTitle>
            <CardDescription>
              Suas justificativas e compensações anteriores
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
                          {j.minutosAbatidos > 0 ? (
                            <span className="text-green-600 font-medium">
                              +{formatMinutesToDisplay(j.minutosAbatidos)}
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
      </main>
    </>
  )
}
