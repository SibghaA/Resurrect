import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, clearSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/db/user'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  const user = await getUserById(session.sub)
  if (!user) {
    clearSession()
    redirect('/auth/login')
  }

  const skillTags = JSON.parse(user.skillTags) as string[]
  const socialLinks = JSON.parse(user.socialLinks) as Record<string, string>
  const hasSocialLinks = Object.values(socialLinks).some(Boolean)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Resurrect</h1>
          <LogoutButton />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
              {user.bio && <p className="text-gray-700 mt-3 leading-relaxed">{user.bio}</p>}
            </div>
            <Link
              href="/profile/edit"
              className="text-sm text-indigo-600 hover:underline font-medium shrink-0 ml-4"
            >
              Edit profile
            </Link>
          </div>

          {skillTags.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {skillTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-indigo-100 text-indigo-800 text-sm px-2.5 py-1 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasSocialLinks && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Links</p>
              <div className="flex gap-4">
                {socialLinks.github && (
                  <a
                    href={socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    GitHub
                  </a>
                )}
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Twitter
                  </a>
                )}
                {socialLinks.website && (
                  <a
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Flake Rate:</span>
              <span className="text-sm font-medium text-gray-900">
                {user.flakeRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              The percentage of collaborations you&apos;ve left after signing a Handshake Agreement.
              This is public and visible to other users.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">My Vault</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Your private workspace. Create projects, track milestones, capture context, and
                  use the AI Micro-Task Engine to break stalled work into 10-minute steps.
                </p>
              </div>
              <Link
                href="/vault"
                className="shrink-0 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Open
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Co-op Board</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  The public board where you can find collaborators or offer your skills. Post a
                  listing with what you have and what you need — interested collaborators sign a
                  Handshake Agreement before accessing your project.
                </p>
              </div>
              <Link
                href="/coop"
                className="shrink-0 border border-indigo-600 text-indigo-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
              >
                Browse
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
