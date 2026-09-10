'use server'

import * as feriadoService from '@/lib/server/services/feriado.service'
import { runAllHrReminders } from '@/lib/server/services/hr-scheduler.service'
import { getSessionUser } from '@/lib/server/auth'
import { runAction } from '@/lib/server/action-result'
import type { Feriado } from '@/lib/types'

export async function listFeriadosAction() {
  return runAction<Feriado[]>(async () => feriadoService.listFeriados())
}

/** Dispara lembretes HR (recesso, contrato, feriado) como fallback no login. */
export async function runRecessoRemindersAction() {
  return runAction<void>(async () => {
    const user = await getSessionUser()
    if (!user) throw new Error('Não autenticado')
    await runAllHrReminders()
  })
}