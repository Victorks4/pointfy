'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LABELS } from '@/lib/constants/labels'
import { formatAbonoMinutosLabel } from '@/lib/domain/ponto/compensacao-utils'
import { getTodayString, parseHorasToMinutos } from '@/lib/domain/ponto/time-utils'
import type { User } from '@/lib/types'
import { toast } from 'sonner'
import { Scale } from 'lucide-react'

type AbonoHorasFormProps = {
  estagiarios: User[]
  selectedEstagiarioId?: string
  onEstagiarioChange?: (id: string) => void
  onSubmit: (input: {
    estagiarioId: string
    data: string
    minutos: number
    descricao: string
  }) => Promise<{ success: boolean; error?: string }>
}

export function AbonoHorasForm({
  estagiarios,
  selectedEstagiarioId,
  onEstagiarioChange,
  onSubmit,
}: AbonoHorasFormProps) {
  const [estagiarioId, setEstagiarioId] = useState(selectedEstagiarioId ?? estagiarios[0]?.id ?? '')
  const [data, setData] = useState('')
  const [horas, setHoras] = useState('')
  const [direcao, setDirecao] = useState<'credito' | 'debito'>('credito')
  const [descricao, setDescricao] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleEstagiario = (id: string) => {
    setEstagiarioId(id)
    onEstagiarioChange?.(id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!estagiarioId) {
      toast.error('Selecione o estagiário')
      return
    }
    if (!data) {
      toast.error('Selecione a data de referência')
      return
    }
    const minutosAbs = parseHorasToMinutos(horas)
    if (!minutosAbs || minutosAbs <= 0) {
      toast.error('Informe as horas no formato HH:MM')
      return
    }
    if (!descricao.trim()) {
      toast.error('Descreva o motivo do abono')
      return
    }

    const minutos = direcao === 'credito' ? minutosAbs : -minutosAbs
    setSubmitting(true)
    try {
      const result = await onSubmit({
        estagiarioId,
        data,
        minutos,
        descricao: descricao.trim(),
      })
      if (!result.success) {
        toast.error(result.error ?? 'Não foi possível registrar o abono')
        return
      }
      toast.success(`Abono ${formatAbonoMinutosLabel(minutos)} registrado`)
      setData('')
      setHoras('')
      setDescricao('')
    } finally {
      setSubmitting(false)
    }
  }

  if (estagiarios.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-4 w-4" />
          Abono de horas
        </CardTitle>
        <CardDescription>
          Ajuste manual do saldo do estagiário (crédito aumenta o saldo; débito reduz).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <FieldGroup>
            <Field>
              <FieldLabel>Estagiário</FieldLabel>
              <Select value={estagiarioId} onValueChange={handleEstagiario}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {estagiarios.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome} ({e.matricula})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="abono-data">{LABELS.DATA_AUSENCIA} (referência)</FieldLabel>
              <Input
                id="abono-data"
                type="date"
                value={data}
                max={getTodayString()}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="abono-horas">Quantidade (HH:MM)</FieldLabel>
                <Input
                  id="abono-horas"
                  placeholder="02:00"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Tipo de ajuste</FieldLabel>
                <Select value={direcao} onValueChange={(v) => setDirecao(v as 'credito' | 'debito')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credito">Crédito (abonar / somar saldo)</SelectItem>
                    <SelectItem value="debito">Débito (descontar saldo)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="abono-motivo">Motivo</FieldLabel>
              <Textarea
                id="abono-motivo"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                required
              />
            </Field>
          </FieldGroup>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Registrando…' : 'Registrar abono'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
