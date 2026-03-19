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
import { toast } from 'sonner'
import { BellRing, Send } from 'lucide-react'

export default function AdminNotificacoesPage() {
  const { user } = useAuth()
  const { usuarios, notificacoes, addNotificacao } = useData()
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')

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

    estagiarios.forEach((estagiario) => {
      addNotificacao({
        userId: estagiario.id,
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        lida: false,
      })
    })

    toast.success(`Notificação enviada para ${estagiarios.length} estagiário(s).`)
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
              O envio será direcionado para todos os usuários com cargo de estagiário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEnviar} className="space-y-4">
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
