import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { getActiveCoopListings } from '@/lib/db/coop-listing'
import CoopListingCard from '@/components/CoopListingCard'
import CoopBoardFilters from '@/components/CoopBoardFilters'

export default async function CoopBoardPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  const listings = await getActiveCoopListings({
    status: searchParams.status,
    search: searchParams.search,
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Co-op Board</h1>
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:underline font-medium"
          >
            Dashboard
          </Link>
        </div>

        <Link
          href="/coop/new"
          className="block w-full text-center bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors mb-6"
        >
          Post to Co-op Board
        </Link>

        <Suspense fallback={null}>
          <div className="mb-6">
            <CoopBoardFilters />
          </div>
        </Suspense>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              {searchParams.status || searchParams.search
                ? 'No listings match your filters.'
                : 'No listings yet. Be the first to post!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <CoopListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
