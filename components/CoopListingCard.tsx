import React from 'react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-green-100 text-green-800',
  'In Discussion': 'bg-blue-100 text-blue-800',
  Filled: 'bg-purple-100 text-purple-800',
  Complete: 'bg-gray-100 text-gray-800',
}

interface CoopListingCardProps {
  listing: {
    id: string
    description: string
    domainTags: string
    skillTagsHave: string
    skillTagsNeed: string
    timeCommitment: string
    status: string
    user: { name: string | null; flakeRate: number }
  }
  matchScore?: number
}

export default function CoopListingCard({ listing, matchScore }: CoopListingCardProps) {
  const domainTags = JSON.parse(listing.domainTags) as string[]
  const skillTagsHave = JSON.parse(listing.skillTagsHave) as string[]
  const skillTagsNeed = JSON.parse(listing.skillTagsNeed) as string[]
  const statusColor = STATUS_COLORS[listing.status] ?? 'bg-gray-100 text-gray-800'

  return (
    <Link
      href={`/coop/${listing.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{listing.project.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{listing.project.domain}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor}`}>
            {listing.status}
          </span>
          {matchScore && matchScore > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              🎯 {matchScore} Skill{matchScore === 1 ? '' : 's'} Match
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 mt-3 line-clamp-2">{listing.description}</p>

      {domainTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {domainTags.map((tag) => (
            <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {skillTagsHave.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium"
          >
            Have: {tag}
          </span>
        ))}
        {skillTagsNeed.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-medium"
          >
            Need: {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{listing.user.name ?? 'Unknown'}</span>
          <span className="text-gray-300">·</span>
          <span>Flake Rate: {listing.user.flakeRate.toFixed(1)}%</span>
        </div>
        <span className="text-xs text-gray-500">{listing.timeCommitment}</span>
      </div>
    </Link>
  )
}
