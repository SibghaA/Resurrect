import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import FlakeRateBadge from '@/components/FlakeRateBadge'
import { getSession } from '@/lib/auth/session'

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const session = await getSession()
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      initiatedCollabs: {
        where: { status: 'Pending Handshake' },
        include: { listing: { include: { project: true } } }
      },
      joinedCollabs: {
        where: { status: 'Pending Handshake' },
        include: { listing: { include: { project: true } } }
      }
    }
  })

  if (!user) notFound()

  // Find handshakes involving the logged-in user and this profile user
  const sharedHandshakes = [
    ...user.initiatedCollabs.filter(c => c.collaboratorId === session?.sub),
    ...user.joinedCollabs.filter(c => c.initiatorId === session?.sub)
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mt-8 relative">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm -mt-16">
            <span className="text-3xl text-indigo-500 font-bold">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Anonymous User'}</h1>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>

          <div className="mt-4">
            <FlakeRateBadge flakeRate={user.flakeRate} resolvedCount={1} />
          </div>

          {user.bio && (
            <p className="mt-6 text-gray-700 max-w-lg mx-auto leading-relaxed">
              {user.bio}
            </p>
          )}

          {user.skillTags && JSON.parse(user.skillTags).length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {JSON.parse(user.skillTags).map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {sharedHandshakes.length > 0 && (
            <div className="mt-8 border-t pt-6 text-left">
               <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider text-center">Pending Handshakes</h3>
               <div className="space-y-3">
                 {sharedHandshakes.map(collab => (
                    <div key={collab.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{collab.listing.project.title}</p>
                        <p className="text-xs text-orange-800 mt-1">Both parties must sign before Vault access is granted.</p>
                      </div>
                      <Link 
                        href={`/collaborations/${collab.id}/handshake`}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700"
                      >
                        Review Document
                      </Link>
                    </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
