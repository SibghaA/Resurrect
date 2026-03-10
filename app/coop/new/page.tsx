import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getProjectsByUserId } from '@/lib/db/project'
import CoopListingForm from '@/components/CoopListingForm'

export default async function NewCoopListingPage() {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  const projects = await getProjectsByUserId(session.sub)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/coop"
          className="text-sm text-indigo-600 hover:underline font-medium"
        >
          &larr; Back to Co-op Board
        </Link>

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Post to Co-op Board</h1>
          <p className="text-sm text-gray-500 mb-6">
            Find a collaborator to help revive your project.
          </p>

          {projects.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-4">
                You need a project in your Vault before posting.
              </p>
              <Link
                href="/vault/new"
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                Create a project
              </Link>
            </div>
          ) : (
            <CoopListingForm
              projects={projects.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  )
}
