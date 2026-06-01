import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadDashboardBootstrap } from '@/lib/server/services/dashboard.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const data = await loadDashboardBootstrap(supabase)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro'
    const status = message === 'Não autenticado' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
