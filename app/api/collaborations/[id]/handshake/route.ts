import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import {
  getHandshakeByCollaborationId,
  createHandshakeAgreement,
  updateHandshakeAgreement,
} from '@/lib/db/handshake'
import { getCollaborationById } from '@/lib/db/collaboration'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collab = await getCollaborationById(params.id)
  if (!collab) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (collab.initiatorId !== session.sub && collab.collaboratorId !== session.sub) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let handshake = await getHandshakeByCollaborationId(params.id)

  if (!handshake) {
    // Auto-create a draft if it doesn't exist yet
    handshake = (await createHandshakeAgreement({
      collaborationId: params.id,
      projectDescription: collab.listing.description,
      collaboratorRole: collab.listing.skillTagsNeed, // default to what was requested
      ipClause: 'Equal Co-ownership',
      creditAgreement: 'Prominent mention as co-creator',
      milestoneSchedule: '[]',
    })) as Awaited<ReturnType<typeof getHandshakeByCollaborationId>>
  }

  return NextResponse.json(handshake)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collab = await getCollaborationById(params.id)
  if (!collab) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (collab.initiatorId !== session.sub && collab.collaboratorId !== session.sub) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const handshake = await getHandshakeByCollaborationId(params.id)
  if (!handshake) return NextResponse.json({ error: 'Handshake not initialized' }, { status: 400 })

  // Cannot edit if either party has already signed (must clear signatures to edit)
  if (handshake.initiatorSignature || handshake.collaboratorSignature) {
    return NextResponse.json({ error: 'Cannot edit signed agreement' }, { status: 400 })
  }

  const body = await req.json()
  const updated = await updateHandshakeAgreement(handshake.id, {
    projectDescription: body.projectDescription,
    collaboratorRole: body.collaboratorRole,
    ipClause: body.ipClause,
    customIpClause: body.customIpClause,
    creditAgreement: body.creditAgreement,
    exitClause: body.exitClause,
    confidentiality: body.confidentiality,
    milestoneSchedule:
      typeof body.milestoneSchedule === 'string'
        ? body.milestoneSchedule
        : JSON.stringify(body.milestoneSchedule),
  })

  return NextResponse.json(updated)
}
