'use client'

import { useEffect } from 'react'
import { runRecessoRemindersAction } from '@/app/actions/feriados'

/** Dispara lembretes de recesso (15 dias antes) uma vez por sessão do estagiário. */
export function EstagiarioHrScheduler() {
  useEffect(() => {
    void runRecessoRemindersAction()
  }, [])
  return null
}
