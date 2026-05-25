import { NextResponse } from 'next/server'
import { loadDashboardSnapshot } from '@/lib/server/services/dashboard.service'

export async function GET() {
  try {
    const data = await loadDashboardSnapshot()
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro'
    const status = message === 'Não autenticado' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
