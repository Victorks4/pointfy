'use client'

import type { User } from '@/lib/types'
import { listRecessoPeriodos } from '@/lib/domain/user/recesso-periodos'
import {
  formatDate,
  getTodayString,
  isAnyRecessApproaching,
  isUserInRecessPeriod,
} from '@/lib/domain/ponto/time-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CalendarRange } from 'lucide-react'
import { emptyCell } from '@/lib/domain/shared/display-utils'

type UserRecessoFields = Pick<
  User,
  'dataInicioRecesso1' | 'dataFimRecesso1' | 'dataInicioRecesso2' | 'dataFimRecesso2'
>

function recessoCell(
  inicio: string | null,
  fim: string | null,
): string {
  if (!inicio || !fim) return emptyCell(null)
  return `${formatDate(inicio)} — ${formatDate(fim)}`
}

function situacaoRecessoBadge(user: UserRecessoFields, hoje: string) {
  if (isUserInRecessPeriod(hoje, user)) {
    return <Badge variant="default">Em recesso</Badge>
  }
  if (isAnyRecessApproaching(user)) {
    return <Badge variant="secondary">Recesso próximo</Badge>
  }
  return <span className="text-muted-foreground text-sm">{emptyCell(null)}</span>
}

type GestorRecessosVinculadosCardProps = {
  estagiarios: User[]
}

/** Visão geral dos recessos de todos os estagiários vinculados ao gestor. */
export function GestorRecessosVinculadosCard({ estagiarios }: GestorRecessosVinculadosCardProps) {
  const hoje = getTodayString()

  if (estagiarios.length === 0) return null

  return (
    <Card className="md:w-72 shrink-0 border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          Recessos
        </CardTitle>
        <CardDescription>Datas cadastradas dos seus estagiários</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto -mx-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Estagiário</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estagiarios.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="align-top py-2">
                    <p className="font-medium text-sm leading-tight">{e.nome}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="block">1: {recessoCell(e.dataInicioRecesso1, e.dataFimRecesso1)}</span>
                      <span className="block">2: {recessoCell(e.dataInicioRecesso2, e.dataFimRecesso2)}</span>
                    </p>
                  </TableCell>
                  <TableCell className="align-top py-2 whitespace-nowrap">
                    {situacaoRecessoBadge(e, hoje)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

type GestorRecessosEstagiarioCardProps = {
  estagiario: User
}

/** Detalhe dos recessos do estagiário selecionado (aba Resumo). */
export function GestorRecessosEstagiarioCard({ estagiario }: GestorRecessosEstagiarioCardProps) {
  const hoje = getTodayString()
  const periodos = listRecessoPeriodos(estagiario)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          Recessos
        </CardTitle>
        <CardDescription>Períodos cadastrados no perfil do estagiário</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {periodos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum recesso cadastrado.</p>
        ) : (
          <ul className="space-y-2">
            {periodos.map((p) => {
              const emRecesso = hoje >= p.inicio && hoje <= p.fim
              return (
                <li
                  key={p.numero}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">Recesso {p.numero}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      · {formatDate(p.inicio)} até {formatDate(p.fim)}
                    </span>
                  </span>
                  {emRecesso ? <Badge>Em recesso</Badge> : null}
                </li>
              )
            })}
          </ul>
        )}
        {isAnyRecessApproaching(estagiario) && !isUserInRecessPeriod(hoje, estagiario) ? (
          <p className="text-xs text-muted-foreground">Há recesso agendado nos próximos dias.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
