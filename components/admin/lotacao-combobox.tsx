'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type LotacaoComboboxProps = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  disabled?: boolean
}

export function LotacaoCombobox({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Selecione a lotação',
  disabled = false,
}: LotacaoComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar lotação..." aria-label="Buscar lotação" />
          <CommandList>
            <CommandEmpty>Nenhuma lotação encontrada.</CommandEmpty>
            <CommandGroup>
              {options.map((lot) => (
                <CommandItem
                  key={lot}
                  value={lot}
                  onSelect={() => {
                    onValueChange(lot)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === lot ? 'opacity-100' : 'opacity-0')}
                    aria-hidden
                  />
                  <span className="truncate">{lot}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
