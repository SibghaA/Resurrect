import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/db/user'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await getUserById(session.sub)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    bio: user.bio,
    skillTags: JSON.parse(user.skillTags) as string[],
    socialLinks: JSON.parse(user.socialLinks) as Record<string, string>,
    flakeRate: user.flakeRate,
    profileSetup: user.profileSetup,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  })
}
