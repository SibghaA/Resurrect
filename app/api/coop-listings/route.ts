import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { coopListingSchema } from '@/lib/validators/coop-listing'
import {
  createCoopListing,
  getActiveCoopListings,
  getActiveListingByProjectId,
} from '@/lib/db/coop-listing'
import { getProjectById } from '@/lib/db/project'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined
  const search = searchParams.get('search') ?? undefined

  const listings = await getActiveCoopListings({ status, search })
  return NextResponse.json(listings)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const result = coopListingSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const project = await getProjectById(result.data.projectId, session.sub)
  if (!project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
  }

  const existing = await getActiveListingByProjectId(result.data.projectId)
  if (existing) {
    return NextResponse.json(
      { error: 'An active listing already exists for this project' },
      { status: 409 }
    )
  }

  const listing = await createCoopListing(session.sub, result.data)
  return NextResponse.json(listing, { status: 201 })
}
