import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId, applicationNote } = await req.json()

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    // Ensure the listing exists and is active
    const listing = await prisma.coopListing.findUnique({
      where: { id: listingId },
    })

    if (!listing || !listing.active) {
      return NextResponse.json({ error: 'Listing is not available' }, { status: 404 })
    }

    if (listing.userId === session.sub) {
      return NextResponse.json({ error: 'Cannot express interest in your own listing' }, { status: 400 })
    }

    // Check if collaboration already exists
    const existingCollab = await prisma.collaboration.findFirst({
      where: {
        listingId,
        collaboratorId: session.sub,
      },
    })

    if (existingCollab) {
      return NextResponse.json({ error: 'Already expressed interest in this listing' }, { status: 400 })
    }

    // Check if application note is required but missing
    if (listing.visibility === 'Application Required' && (!applicationNote || !applicationNote.trim())) {
      return NextResponse.json({ error: 'Application note is required for this listing' }, { status: 400 })
    }

    const collab = await prisma.collaboration.create({
      data: {
        listingId,
        initiatorId: listing.userId, // The project owner is the initiator of the listing
        collaboratorId: session.sub, // The user expressing interest is the collaborator
        status: 'Pending Handshake',
        applicationNote,
      },
    })

    return NextResponse.json({ success: true, collaboration: collab }, { status: 201 })
  } catch (error) {
    console.error('Error creating collaboration:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
