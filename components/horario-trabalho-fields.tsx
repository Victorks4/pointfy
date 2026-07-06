'use client'

import { Field, FieldLabel } from '@/components/ui/field'
import { TimeField } from '@/components/time-field'
import type { HorarioTrabalho } from '@/lib/horario-trabalho'

type HorarioTrabalhoFieldsProps = {
  idPrefix: string
  value: HorarioTrabalho
  onChange: (value: HorarioTrabalho) => void
}

export function HorarioTrabalhoFields({ idPrefix, value, onChange }: HorarioTrabalhoFieldsProps) {
  const set = (patch: Partial<HorarioTrabalho>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/15 p-4 sm:col-span-2">
      <div>
        <p className="text-sm font-semibold text-foreground">Jornada de trabalho</p>
        <p className="text-xs text-muted-foreground">
          Horários previstos do estagiário, incluindo o intervalo (pausa).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field className="gap-2">
          <FieldLabel htmlFor={`${idPrefix}-jornada-entrada`} className="text-sm font-medium text-foreground/80">
            Horário de entrada
          </FieldLabel>
          <TimeField
            id={`${idPrefix}-jornada-entrada`}
            value={value.horarioTrabalhoEntrada1 ?? ''}
            onChange={(v) => set({ horarioTrabalhoEntrada1: v || null })}
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor={`${idPrefix}-jornada-pausa-saida`} className="text-sm font-medium text-foreground/80">
            Saída para intervalo
          </FieldLabel>
          <TimeField
            id={`${idPrefix}-jornada-pausa-saida`}
            value={value.horarioTrabalhoSaida1 ?? ''}
            onChange={(v) => set({ horarioTrabalhoSaida1: v || null })}
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor={`${idPrefix}-jornada-pausa-retorno`} className="text-sm font-medium text-foreground/80">
            Retorno do intervalo
          </FieldLabel>
          <TimeField
            id={`${idPrefix}-jornada-pausa-retorno`}
            value={value.horarioTrabalhoEntrada2 ?? ''}
            onChange={(v) => set({ horarioTrabalhoEntrada2: v || null })}
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor={`${idPrefix}-jornada-saida`} className="text-sm font-medium text-foreground/80">
            Horário de saída
          </FieldLabel>
          <TimeField
            id={`${idPrefix}-jornada-saida`}
            value={value.horarioTrabalhoSaida2 ?? ''}
            onChange={(v) => set({ horarioTrabalhoSaida2: v || null })}
          />
        </Field>
      </div>
    </div>
  )
}
