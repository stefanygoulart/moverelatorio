import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAccountInsights } from '@/lib/meta'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')
  const dateStart = searchParams.get('dateStart')
  const dateEnd = searchParams.get('dateEnd')

  if (!accountId || !dateStart || !dateEnd)
    return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 })

  try {
    const insights = await getAccountInsights(accountId, session.accessToken, dateStart, dateEnd)
    return NextResponse.json({ insights })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
