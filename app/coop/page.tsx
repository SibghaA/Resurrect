import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { getActiveCoopListings } from '@/lib/db/coop-listing'
import { getPersonalizedListings } from '@/lib/skill-matcher'
import CoopListingCard from '@/components/CoopListingCard'
import CoopBoardFilters from '@/components/CoopBoardFilters'

export default async function CoopBoardPage({
  searchParams,
}: {
  searchParams: {
    status?: string
    search?: string
    feed?: string
    domain?: string
    skillNeed?: string
    commitment?: string
  }
}) {
  const session = await getSession()
  const isForYou = searchParams.feed === 'foryou'

  if (isForYou && !session) {
    redirect('/auth/login')
  }

  const listings = isForYou
    ? await getPersonalizedListings(session!.sub)
    : await getActiveCoopListings({
        status: searchParams.status,
        search: searchParams.search,
        domain: searchParams.domain,
        skillNeed: searchParams.skillNeed,
        commitment: searchParams.commitment,
      })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Co-op Board</h1>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline font-medium">
            Dashboard
          </Link>
        </div>

        <Link
          href="/coop/new"
          className="block w-full text-center bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors mb-6"
        >
          Post to Co-op Board
        </Link>

        <div className="flex bg-gray-100 p-1 rounded-lg mb-6 w-full max-w-sm mx-auto">
          <Link
            href="/coop"
            className={`flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors ${
              !isForYou ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Projects
          </Link>
          <Link
            href="/coop?feed=foryou"
            className={`flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors ${
              isForYou ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            For You
          </Link>
        </div>

        {!isForYou && (
          <Suspense fallback={null}>
            <div className="mb-6">
              <CoopBoardFilters />
            </div>
          </Suspense>
        )}

        {listings === null ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
            <p className="text-gray-500 mb-6">
              Add your skills to see personalized project recommendations matching your expertise.
            </p>
            <Link
              href="/profile/edit"
              className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Update Skills
            </Link>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              {isForYou
                ? 'No projects currently need your exact skills. Try expanding your skill tags!'
                : searchParams.status || searchParams.search
                  ? 'No listings match your filters.'
                  : 'No listings yet. Be the first to post!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <CoopListingCard
                key={listing.id}
                listing={listing}
                matchScore={'matchScore' in listing ? listing.matchScore : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
