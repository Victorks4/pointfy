'use client'

import { useEffect } from 'react'
import { runHrSchedulerAction } from '@/app/actions/admin'

/** Dispara lembretes de recesso/feriado uma vez por sessão admin. */
export function AdminHrScheduler() {
  useEffect(() => {
    void runHrSchedulerAction()
  }, [])
  return null
}
