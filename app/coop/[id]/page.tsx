import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getCoopListingById } from '@/lib/db/coop-listing'
import CoopListingActions from '@/components/CoopListingActions'

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-green-100 text-green-800',
  'In Discussion': 'bg-blue-100 text-blue-800',
  Filled: 'bg-purple-100 text-purple-800',
  Complete: 'bg-gray-100 text-gray-800',
}

export default async function CoopListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  const listing = await getCoopListingById(params.id)
  if (!listing || !listing.active) notFound()

  const domainTags = JSON.parse(listing.domainTags) as string[]
  const skillTagsHave = JSON.parse(listing.skillTagsHave) as string[]
  const skillTagsNeed = JSON.parse(listing.skillTagsNeed) as string[]
  const statusColor = STATUS_COLORS[listing.status] ?? 'bg-gray-100 text-gray-800'
  const isOwner = listing.userId === session.sub

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{listing.project.title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{listing.project.domain}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor}`}>
              {listing.status}
            </span>
          </div>

          <p className="text-sm text-gray-700 mt-4 leading-relaxed">{listing.description}</p>

          {domainTags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Domains</p>
              <div className="flex flex-wrap gap-1.5">
                {domainTags.map((tag) => (
                  <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            {skillTagsHave.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">I Have</p>
                <div className="flex flex-wrap gap-1.5">
                  {skillTagsHave.map((tag) => (
                    <span key={tag} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {skillTagsNeed.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">I Need</p>
                <div className="flex flex-wrap gap-1.5">
                  {skillTagsNeed.map((tag) => (
                    <span key={tag} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm text-gray-600">
            <p><span className="font-medium text-gray-700">Time Commitment:</span> {listing.timeCommitment}</p>
            <p><span className="font-medium text-gray-700">Visibility:</span> {listing.visibility}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">First Milestone</p>
            <p className="text-sm text-gray-700">{listing.milestonePreview}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
            <span>{listing.user.name ?? 'Unknown'}</span>
            <span className="text-gray-300">·</span>
            <span>Flake Rate: <span className="font-medium text-gray-700">{listing.user.flakeRate.toFixed(1)}%</span></span>
          </div>
        </div>

        {isOwner && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Manage Listing</h2>
            <CoopListingActions listingId={listing.id} />
          </div>
        )}
      </div>
    </div>
  )
}
