'use client'

import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Check, CheckCheck } from 'lucide-react'

export default function NotificacoesPage() {
  const { user } = useAuth()
  const { getNotificacoesByUser, markNotificacaoAsRead } = useData()

  const notificacoes = user ? getNotificacoesByUser(user.id) : []
  const naoLidas = notificacoes.filter(n => !n.lida)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleMarkAsRead = (id: string) => {
    markNotificacaoAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    naoLidas.forEach(n => markNotificacaoAsRead(n.id))
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Notificações</h1>
      </header>

      <main data-fy-anchor="fy-notificacoes-panel" className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Suas Notificações
            </h2>
            <p className="text-muted-foreground">
              {naoLidas.length > 0 
                ? `Você tem ${naoLidas.length} notificação(ões) não lida(s)`
                : 'Todas as notificações foram lidas'
              }
            </p>
          </div>

          {naoLidas.length > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {notificacoes.length > 0 ? (
          <div className="space-y-4">
            {notificacoes.map((notificacao) => (
              <Card 
                key={notificacao.id}
                className={notificacao.lida ? 'opacity-60' : 'border-primary/20 bg-primary/5'}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {notificacao.lida ? (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Bell className="h-4 w-4 text-primary" />
                      )}
                      <CardTitle className="text-base">
                        {notificacao.titulo}
                      </CardTitle>
                      {!notificacao.lida && (
                        <Badge variant="default" className="text-xs">
                          Nova
                        </Badge>
                      )}
                    </div>
                    {!notificacao.lida && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMarkAsRead(notificacao.id)}
                      >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Marcar como lida</span>
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {formatDate(notificacao.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground">
                    {notificacao.mensagem}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Você não tem notificações no momento
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}
