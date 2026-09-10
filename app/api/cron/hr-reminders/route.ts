import { NextResponse } from 'next/server'
import { runAllHrReminders } from '@/lib/server/services/hr-scheduler.service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    await runAllHrReminders()
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao executar lembretes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
