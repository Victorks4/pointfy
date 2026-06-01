import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listPontosScoped } from '@/lib/server/services/dashboard.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const supabase = await createClient()
    const pontos = await listPontosScoped(
      {
        userId: searchParams.get('userId') ?? undefined,
        from: searchParams.get('from') ?? undefined,
        to: searchParams.get('to') ?? undefined,
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      },
      supabase,
    )
    return NextResponse.json({ pontos }, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro'
    const status =
      message === 'Não autenticado' ? 401 : message === 'Sem permissão' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
