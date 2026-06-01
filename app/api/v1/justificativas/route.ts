import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listJustificativasScoped } from '@/lib/server/services/dashboard.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const supabase = await createClient()
    const justificativas = await listJustificativasScoped(
      {
        userId: searchParams.get('userId') ?? undefined,
        rhVisible: searchParams.get('rh') === '1',
        signFiles: searchParams.get('sign') === '1',
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      },
      supabase,
    )
    return NextResponse.json({ justificativas }, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro'
    const status =
      message === 'Não autenticado' ? 401 : message === 'Sem permissão' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
