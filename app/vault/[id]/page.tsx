import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getProjectById } from '@/lib/db/project'
import { getActiveListingByProjectId } from '@/lib/db/coop-listing'
import { format } from 'date-fns'
import StatusManager from '@/components/StatusManager'
import { statusBadgeColor } from '@/lib/utils/status'
import ContextSnapshot from '@/components/ContextSnapshot'
import MicroTaskEngine from '@/components/MicroTaskEngine'

interface ContextSnapshotData {
  currentState?: string
  blockers?: string
  nextSteps?: string
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  const project = await getProjectById(params.id, session.sub)
  if (!project) notFound()

  const activeListing = await getActiveListingByProjectId(params.id)

  let snapshot: ContextSnapshotData = { currentState: '', blockers: '', nextSteps: '' }
  try {
    const parsed: unknown = JSON.parse(project.contextSnapshot)
    if (parsed && typeof parsed === 'object') {
      snapshot = parsed as ContextSnapshotData
    }
  } catch {
    // use defaults
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/vault" className="text-sm text-indigo-600 hover:underline font-medium">
          &larr; Back to Vault
        </Link>

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ml-4 ${statusBadgeColor(project.status)}`}
            >
              {project.status}
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-1">{project.domain}</p>
          <p className="text-sm text-gray-700 mt-3">{project.description}</p>

          <div className="flex gap-4 mt-4 text-sm text-gray-500">
            <span>Effort remaining: {project.effortRemaining}</span>
            <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            {activeListing ? (
              <Link
                href={`/coop/${activeListing.id}`}
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                View Co-op listing &rarr;
              </Link>
            ) : (
              <Link
                href={`/coop/new`}
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                Post to Co-op Board
              </Link>
            )}
          </div>
        </div>

        {/* Status Management */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Status</h2>
          <p className="text-sm text-gray-500 mb-4">
            Keep this up to date so collaborators and the Co-op Board reflect the real state of your
            project.
          </p>
          <StatusManager projectId={project.id} currentStatus={project.status} />
        </div>

        {/* Context Snapshot */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Where you left off</h2>
          <p className="text-sm text-gray-500 mb-4">
            Capture context so you can jump back in later.
          </p>
          <ContextSnapshot
            projectId={project.id}
            initialSnapshot={{
              currentState: snapshot.currentState ?? '',
              blockers: snapshot.blockers ?? '',
              nextSteps: snapshot.nextSteps ?? '',
            }}
          />
        </div>

        {/* Micro-Task Engine */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Micro-Task Engine</h2>
          <p className="text-sm text-gray-500 mb-4">
            Break a milestone into ~10-minute tasks so you can make progress right now.
          </p>
          <MicroTaskEngine projectId={project.id} />
        </div>

        {/* Status History */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>

          {project.statusLogs.length === 0 ? (
            <p className="text-sm text-gray-500">
              No changes yet — this project is just getting started.
            </p>
          ) : (
            <div className="space-y-4">
              {project.statusLogs.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2" />
                    <div className="w-px bg-gray-200 flex-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-gray-900">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mr-1 ${statusBadgeColor(log.fromStatus)}`}
                      >
                        {log.fromStatus}
                      </span>
                      {' → '}
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ml-1 ${statusBadgeColor(log.toStatus)}`}
                      >
                        {log.toStatus}
                      </span>
                    </p>
                    {log.notes && <p className="text-sm text-gray-600 mt-1">{log.notes}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(log.createdAt), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
