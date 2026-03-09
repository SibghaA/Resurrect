import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getProjectsByUserId } from '@/lib/db/project'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  Paused: 'bg-amber-100 text-amber-800',
  'Handed Off': 'bg-blue-100 text-blue-800',
  Complete: 'bg-gray-100 text-gray-800',
}

function badgeColor(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'
}

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
              <Link
                key={project.id}
                href={`/vault/${project.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{project.title}</h2>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ml-4 ${badgeColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{project.domain}</p>
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">{project.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-400">
                    Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
                  </p>
                  {project.status === 'Paused' && (
                    <span className="text-xs font-medium text-amber-700">
                      Waiting for you
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
