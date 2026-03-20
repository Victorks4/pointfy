'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { BellRing, Send } from 'lucide-react'

export default function AdminNotificacoesPage() {
  const { user } = useAuth()
  const { usuarios, notificacoes, addNotificacao } = useData()
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [destinoUserId, setDestinoUserId] = useState<string | 'all'>('all')

  const estagiarios = useMemo(
    () => usuarios.filter((usuario) => usuario.cargo === 'estagiario'),
    [usuarios]
  )

  const notificacoesParaEstagiarios = useMemo(
    () => notificacoes.filter((item) => item.userId === null || estagiarios.some((e) => e.id === item.userId)),
    [notificacoes, estagiarios]
  )

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim() || !mensagem.trim()) {
      toast.error('Preencha título e mensagem.')
      return
    }

    const tituloTrim = titulo.trim()
    const mensagemTrim = mensagem.trim()

    if (destinoUserId === 'all') {
      addNotificacao({
        userId: null,
        titulo: tituloTrim,
        mensagem: mensagemTrim,
        lida: false,
      })
      toast.success('Notificação enviada para todos os estagiários.')
    } else {
      addNotificacao({
        userId: destinoUserId,
        titulo: tituloTrim,
        mensagem: mensagemTrim,
        lida: false,
      })
      toast.success('Notificação enviada para o estagiário selecionado.')
    }
    setTitulo('')
    setMensagem('')
  }

  if (user?.cargo !== 'admin') return null

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Notificações</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Enviar nova notificação</CardTitle>
            <CardDescription>
              Selecione o destino (todos ou um estagiário específico).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEnviar} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Destino</label>
                <Select value={destinoUserId} onValueChange={(v) => setDestinoUserId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estagiários</SelectItem>
                    {estagiarios.map((estagiario) => (
                      <SelectItem key={estagiario.id} value={estagiario.id}>
                        {estagiario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Título da notificação"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              <Textarea
                placeholder="Mensagem para os estagiários"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={4}
              />
              <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                Enviar para estagiários
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações enviadas</CardTitle>
            <CardDescription>Histórico de envios para estagiários.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notificacoesParaEstagiarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma notificação enviada.</p>
            ) : (
              notificacoesParaEstagiarios.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{item.titulo}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.mensagem}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
