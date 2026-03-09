import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getProjectsByUserId } from '@/lib/db/project'
import { format } from 'date-fns'

export default async function VaultPage() {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  const projects = await getProjectsByUserId(session.sub)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Vault</h1>
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:underline font-medium"
          >
            Dashboard
          </Link>
        </div>

        <Link
          href="/vault/new"
          className="block w-full text-center bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors mb-6"
        >
          New Project
        </Link>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No projects yet. Create your first one to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{project.title}</h2>
                  <span className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md shrink-0 ml-4">
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{project.domain}</p>
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">{project.description}</p>
                <p className="text-xs text-gray-400 mt-3">
                  Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
