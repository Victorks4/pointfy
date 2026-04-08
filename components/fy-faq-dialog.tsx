'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { FY_NAME } from '@/lib/fy-mascot'
import type { FyTipRole } from '@/lib/fy-mascot'
import { getFyFaqItemsForRole } from '@/lib/fy-faq'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageCircle } from 'lucide-react'

type FyFaqDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: FyTipRole
}

export function FyFaqDialog({ open, onOpenChange, role }: FyFaqDialogProps) {
  const items = useMemo(() => getFyFaqItemsForRole(role), [role])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const answerRegionId = useId()

  useEffect(() => {
    if (!open) {
      setSelectedId(null)
    }
  }, [open])

  const selected = items.find((i) => i.id === selectedId) ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-border/80 px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-left">
            <MessageCircle className="h-5 w-5 text-sky-600 shrink-0" aria-hidden />
            Perguntas frequentes
          </DialogTitle>
          <DialogDescription className="text-left">
            Escolha uma pergunta — o {FY_NAME} responde com base no seu perfil ({role === 'admin' ? 'administrador' : role === 'gestor' ? 'gestor' : 'estagiário'}).
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row sm:divide-x sm:divide-border/80">
          <ScrollArea className="h-[min(220px,32vh)] sm:h-auto sm:max-h-[min(420px,52vh)] sm:w-[44%] sm:min-w-[200px]">
            <nav className="flex flex-col gap-0.5 p-3" aria-label="Lista de perguntas frequentes">
              {items.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  className={cn(
                    'h-auto min-h-10 w-full justify-start whitespace-normal px-3 py-2 text-left text-sm font-normal leading-snug',
                    selectedId === item.id &&
                      'bg-sky-50 text-sky-950 ring-1 ring-sky-200/80 hover:bg-sky-50',
                  )}
                  onClick={() => setSelectedId(item.id)}
                >
                  {item.question}
                </Button>
              ))}
            </nav>
          </ScrollArea>

          <div
            className="flex min-h-0 flex-1 flex-col border-t border-border/80 sm:border-t-0"
            id={answerRegionId}
            role="region"
            aria-live="polite"
            aria-label={`Resposta do ${FY_NAME}`}
          >
            <div className="min-h-[min(200px,28vh)] flex-1 overflow-y-auto p-4 sm:min-h-[min(280px,52vh)]">
              {selected ? (
                <div className="rounded-xl border border-sky-100 bg-gradient-to-b from-sky-50/90 to-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-700/90">{FY_NAME}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-800">{selected.answer}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Toque em uma pergunta à esquerda (ou acima, no celular) para eu te explicar em poucas frases.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
