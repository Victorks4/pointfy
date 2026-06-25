import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadDashboardSnapshot } from '@/lib/server/services/dashboard.service'

export const dynamic = 'force-dynamic'

function apiStatus(message: string): number {
  if (message === 'Não autenticado') return 401
  if (message === 'Sem permissão') return 403
  return 500
}

export async function GET() {
  try {
    const supabase = await createClient()
    const data = await loadDashboardSnapshot(supabase)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro'
    return NextResponse.json({ error: message }, { status: apiStatus(message) })
  }
}
