import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getCoopListingById, deactivateCoopListing } from '@/lib/db/coop-listing'

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await getCoopListingById(params.id)
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  if (listing.userId !== session.sub) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const deactivated = await deactivateCoopListing(params.id)
  return NextResponse.json(deactivated)
}
