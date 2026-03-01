import { NextRequest, NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validators/auth'
import { createUser, getUserByEmail } from '@/lib/db/user'
import { hashPassword } from '@/lib/auth/password'
import { setSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const body: unknown = await req.json()
  const result = registerSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { email, password } = result.data
  const existing = await getUserByEmail(email)
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const user = await createUser(email, passwordHash)
  await setSession(user.id, user.email, false)
  return NextResponse.json({ success: true })
}
