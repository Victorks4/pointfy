'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RelatorioPontoPanel } from '@/components/ponto/relatorio-ponto-panel'
import { getGestorNomes } from '@/lib/gestor-utils'
import { emptyLabel } from '@/lib/display-utils'

export default function RelatoriosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    usuarios,
    pontos,
    justificativas,
    getEstagiariosDoGestor,
    getBancoHorasPorPeriodo,
    isPresencaBloqueada,
  } = useData()

  const [selectedEstagiarioId, setSelectedEstagiarioId] = useState('')

  const estagiariosDisponiveis = useMemo(() => {
    if (!user) return []
    if (user.cargo === 'admin') {
      return usuarios.filter((u) => u.cargo === 'estagiario' && u.ativo)
    }
    if (user.cargo === 'gestor') {
      return getEstagiariosDoGestor(user.id)
    }
    return []
  }, [user, usuarios, getEstagiariosDoGestor])

  useEffect(() => {
    if (!user) return
    if (user.cargo === 'estagiario') return
    if (estagiariosDisponiveis.length > 0 && !selectedEstagiarioId) {
      setSelectedEstagiarioId(estagiariosDisponiveis[0].id)
    }
  }, [user, estagiariosDisponiveis, selectedEstagiarioId])

  const targetUser = useMemo(() => {
    if (!user) return null
    if (user.cargo === 'estagiario') return user
    return estagiariosDisponiveis.find((u) => u.id === selectedEstagiarioId) ?? null
  }, [user, estagiariosDisponiveis, selectedEstagiarioId])

  const gestorNome = useMemo(() => {
    if (!targetUser) return null
    const nome = getGestorNomes(targetUser, usuarios)
    return nome === emptyLabel(null) ? null : nome
  }, [targetUser, usuarios])

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground text-sm">
        Carregando…
      </div>
    )
  }

  if (user.cargo !== 'estagiario' && user.cargo !== 'gestor' && user.cargo !== 'admin') {
    router.replace('/dashboard')
    return null
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 print:hidden">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Relatórios</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-3xl">
        {user.cargo !== 'estagiario' ? (
          <div className="space-y-2 print:hidden">
            <label htmlFor="relatorio-estagiario" className="text-sm font-medium">
              Estagiário
            </label>
            <Select value={selectedEstagiarioId} onValueChange={setSelectedEstagiarioId}>
              <SelectTrigger id="relatorio-estagiario" className="max-w-md">
                <SelectValue placeholder="Selecione o estagiário" />
              </SelectTrigger>
              <SelectContent>
                {estagiariosDisponiveis.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome} ({e.matricula})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {targetUser ? (
          <RelatorioPontoPanel
            targetUser={targetUser}
            gestorNome={gestorNome}
            pontos={pontos}
            justificativas={justificativas}
            getBancoHorasPorPeriodo={getBancoHorasPorPeriodo}
            isPresencaBloqueada={isPresencaBloqueada}
            title={user.cargo === 'estagiario' ? 'Meu relatório mensal' : 'Relatório de ponto encerrado'}
            description={
              user.cargo === 'estagiario'
                ? undefined
                : `Relatório mensal de ${targetUser.nome}`
            }
            showInfoAlert
          />
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum estagiário disponível para relatório.</p>
        )}
      </main>
    </>
  )
}
