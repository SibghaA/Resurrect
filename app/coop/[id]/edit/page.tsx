import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getCoopListingById } from '@/lib/db/coop-listing'
import CoopListingForm from '@/components/CoopListingForm'

export default async function EditCoopListingPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  const listing = await getCoopListingById(params.id)
  if (!listing || !listing.active) notFound()
  if (listing.userId !== session.sub) redirect(`/coop/${params.id}`)

  const domainTags = JSON.parse(listing.domainTags) as string[]
  const skillTagsHave = JSON.parse(listing.skillTagsHave) as string[]
  const skillTagsNeed = JSON.parse(listing.skillTagsNeed) as string[]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/coop/${params.id}`}
          className="text-sm text-indigo-600 hover:underline font-medium"
        >
          &larr; Back to listing
        </Link>

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Edit Listing</h1>
          <p className="text-sm text-gray-500 mb-6">{listing.project.title}</p>

          <CoopListingForm
            projects={[]}
            listingId={listing.id}
            initialValues={{
              projectId: listing.projectId,
              description: listing.description,
              domainTags,
              skillTagsHave,
              skillTagsNeed,
              timeCommitment: listing.timeCommitment,
              milestonePreview: listing.milestonePreview,
              visibility: listing.visibility,
            }}
          />
        </div>
      </div>
    </div>
  )
}
