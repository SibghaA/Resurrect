import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/db/user'
import ProfileForm from '@/components/ProfileForm'

export default async function ProfileEditPage() {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  const user = await getUserById(session.sub)
  if (!user) redirect('/auth/login')

  const initialData = {
    name: user.name ?? '',
    bio: user.bio ?? '',
    skillTags: JSON.parse(user.skillTags) as string[],
    socialLinks: JSON.parse(user.socialLinks) as { github?: string; twitter?: string; website?: string },
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit profile</h1>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <ProfileForm initialData={initialData} />
        </div>
      </div>
    </div>
  )
}
