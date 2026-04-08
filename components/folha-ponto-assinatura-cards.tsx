'use client'

import { useMemo, useState } from 'react'
import { useData } from '@/lib/data-context'
import type { User } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SignatureCaptureDialog } from '@/components/signature-capture-dialog'
import {
  DIA_INICIO_ASSINATURA_FOLHA,
  isPeriodoAssinaturaFolhaPonto,
  mesAnoFechamentoAtual,
} from '@/lib/folha-ponto-assinatura'
import { PenLine } from 'lucide-react'
import { toast } from 'sonner'

const MESES_NOME: Record<string, string> = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
}

function labelMesAno(mesAno: string): string {
  const [y, m] = mesAno.split('-')
  return `${MESES_NOME[m] ?? m} de ${y}`
}

function erroAssinatura(reason: string): string {
  const map: Record<string, string> = {
    fora_do_periodo: `Disponível apenas a partir do dia ${DIA_INICIO_ASSINATURA_FOLHA} de cada mês.`,
    nao_autorizado: 'Operação não permitida.',
    gestor_sem_assinatura: 'Salve sua assinatura antes (importar ou desenhar).',
    estagiario_sem_assinatura: 'Salve sua assinatura antes (importar ou desenhar).',
    sem_gestor: 'Você ainda não tem gestor vinculado. Fale com o administrador.',
  }
  return map[reason] ?? 'Não foi possível concluir.'
}

type GestorFolhaCardProps = {
  gestor: User
  estagiario: User
}

export function GestorFolhaPontoCard({ gestor, estagiario }: GestorFolhaCardProps) {
  const { salvarAssinaturaUsuario, getAssinaturaUsuario, getFolhaPontoMensal, registrarAssinaturaGestorFolha } =
    useData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const hoje = useMemo(() => new Date(), [])
  const mesAno = mesAnoFechamentoAtual(hoje)
  const periodoOk = isPeriodoAssinaturaFolhaPonto(hoje)

  const minhaAssinatura = getAssinaturaUsuario(gestor.id)
  const folha = getFolhaPontoMensal(estagiario.id, mesAno)
  const gestorJaAssinou = Boolean(folha?.gestorAssinouEm)

  const handleAssinar = () => {
    if (!minhaAssinatura) {
      toast.error('Salve sua assinatura primeiro.')
      return
    }
    const r = registrarAssinaturaGestorFolha(estagiario.id, gestor.id)
    if (!r.ok) {
      toast.error(erroAssinatura(r.reason))
      return
    }
    toast.success(`Folha de ${labelMesAno(mesAno)} assinada para ${estagiario.nome}.`)
  }

  return (
    <>
      <Card className="border-zinc-300 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            Folha de ponto (fechamento)
            {gestorJaAssinou ? (
              <Badge variant="secondary" className="font-normal">
                Você já assinou
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            A partir do dia {DIA_INICIO_ASSINATURA_FOLHA}, você pode assinar a folha do mês em curso de{' '}
            <strong>{estagiario.nome}</strong>. Não é necessário visualizar o PDF; a assinatura fica registrada
            no sistema para quando o relatório for gerado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {!periodoOk ? (
            <p className="text-sm text-muted-foreground">
              As assinaturas abrem no dia {DIA_INICIO_ASSINATURA_FOLHA}. Hoje ainda não é possível assinar.
            </p>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                <PenLine className="mr-2 h-4 w-4" />
                {minhaAssinatura ? 'Atualizar minha assinatura' : 'Importar / desenhar minha assinatura'}
              </Button>
              <Button type="button" size="sm" disabled={gestorJaAssinou} onClick={handleAssinar}>
                Assinar folha — {labelMesAno(mesAno)}
              </Button>
              {folha?.estagiarioAssinouEm ? (
                <span className="text-xs text-muted-foreground">
                  Estagiário já assinou este mês.
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Aguardando assinatura do estagiário.</span>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <SignatureCaptureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Sua assinatura como gestor"
        description="Desenhe no quadro ou envie uma foto nítida da assinatura. Ela será reutilizada nas folhas que você assinar."
        onSave={(dataUrl) => {
          salvarAssinaturaUsuario(gestor.id, dataUrl)
          toast.success('Assinatura salva no sistema.')
        }}
      />
    </>
  )
}

type EstagiarioFolhaCardProps = {
  estagiario: User
}

export function EstagiarioFolhaPontoCard({ estagiario }: EstagiarioFolhaCardProps) {
  const {
    usuarios,
    salvarAssinaturaUsuario,
    getAssinaturaUsuario,
    getFolhaPontoMensal,
    registrarAssinaturaEstagiarioFolha,
  } = useData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const hoje = useMemo(() => new Date(), [])
  const mesAno = mesAnoFechamentoAtual(hoje)
  const periodoOk = isPeriodoAssinaturaFolhaPonto(hoje)

  const minhaAssinatura = getAssinaturaUsuario(estagiario.id)
  const folha = getFolhaPontoMensal(estagiario.id, mesAno)
  const estJaAssinou = Boolean(folha?.estagiarioAssinouEm)
  const gestor = estagiario.gestorId ? usuarios.find((u) => u.id === estagiario.gestorId) : null

  const handleAssinar = () => {
    if (!minhaAssinatura) {
      toast.error('Salve sua assinatura primeiro.')
      return
    }
    const r = registrarAssinaturaEstagiarioFolha(estagiario.id)
    if (!r.ok) {
      toast.error(erroAssinatura(r.reason))
      return
    }
    toast.success(`Folha de ${labelMesAno(mesAno)} assinada.`)
  }

  return (
    <>
      <Card className="border-zinc-300 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            Assinatura da folha de ponto
            {estJaAssinou ? (
              <Badge variant="secondary" className="font-normal">
                Você já assinou
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            Entre os dias {DIA_INICIO_ASSINATURA_FOLHA} e o fim do mês, confirme sua folha de{' '}
            <strong>{labelMesAno(mesAno)}</strong>. Use a mesma assinatura nas próximas vezes, se quiser.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {!gestor ? (
            <p className="text-sm text-muted-foreground">
              Sem gestor vinculado — o administrador precisa cadastrar antes do fechamento.
            </p>
          ) : !periodoOk ? (
            <p className="text-sm text-muted-foreground">
              As assinaturas abrem no dia {DIA_INICIO_ASSINATURA_FOLHA}.
            </p>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                <PenLine className="mr-2 h-4 w-4" />
                {minhaAssinatura ? 'Atualizar minha assinatura' : 'Importar / desenhar minha assinatura'}
              </Button>
              <Button type="button" size="sm" disabled={estJaAssinou} onClick={handleAssinar}>
                Assinar minha folha — {labelMesAno(mesAno)}
              </Button>
              {folha?.gestorAssinouEm ? (
                <span className="text-xs text-muted-foreground">Gestor já assinou este mês.</span>
              ) : (
                <span className="text-xs text-muted-foreground">Aguardando assinatura do gestor.</span>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <SignatureCaptureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Sua assinatura"
        description="Desenhe ou envie uma foto da assinatura. Ela será usada na folha de ponto em PDF."
        onSave={(dataUrl) => {
          salvarAssinaturaUsuario(estagiario.id, dataUrl)
          toast.success('Assinatura salva no sistema.')
        }}
      />
    </>
  )
}
