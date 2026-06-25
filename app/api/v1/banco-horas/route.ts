import { NextRequest, NextResponse } from 'next/server'
import { getBancoHorasForUser } from '@/lib/server/services/dashboard.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
    }
    const year = searchParams.get('year') ?? undefined
    const month = searchParams.get('month') ?? undefined
    const saldo = await getBancoHorasForUser(userId, year, month)
    return NextResponse.json({ saldoMinutos: saldo })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro'
    const status = message === 'Não autenticado' ? 401 : message === 'Sem permissão' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
