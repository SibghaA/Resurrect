import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validators/auth'
import { getUserByEmail } from '@/lib/db/user'
import { verifyPassword } from '@/lib/auth/password'
import { setSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const body: unknown = await req.json()
  const result = loginSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { email, password } = result.data
  const user = await getUserByEmail(email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  await setSession(user.id, user.email, user.profileSetup)
  return NextResponse.json({ success: true, profileSetup: user.profileSetup })
}
