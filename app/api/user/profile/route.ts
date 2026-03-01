import { NextRequest, NextResponse } from 'next/server'
import { profileSchema } from '@/lib/validators/profile'
import { updateUserProfile } from '@/lib/db/user'
import { getSession, setSession } from '@/lib/auth/session'

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const result = profileSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const user = await updateUserProfile(session.sub, result.data)
  await setSession(user.id, user.email, true)
  return NextResponse.json({ success: true })
}
