import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { checkAiRateLimit } from '@/lib/ai/rate-limit'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { usedThisMonth, limit, isProTier } = await checkAiRateLimit(session.sub)
  return NextResponse.json({ usedThisMonth, limit, isProTier })
}
