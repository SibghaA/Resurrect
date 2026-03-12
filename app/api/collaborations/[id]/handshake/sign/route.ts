import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import {
  getHandshakeByCollaborationId,
  signHandshake,
  updateHandshakePdfInfo,
} from '@/lib/db/handshake'
import { updateCollaborationStatus } from '@/lib/db/collaboration'
import { generateHandshakePDF, uploadToS3, computePdfHash } from '@/lib/pdf'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { signature } = await req.json()
  if (!signature || typeof signature !== 'string') {
    return NextResponse.json({ error: 'Signature required' }, { status: 400 })
  }

  const handshake = await getHandshakeByCollaborationId(params.id)
  if (!handshake) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const collab = handshake.collaboration
  const isInitiator = collab.initiatorId === session.sub
  const isCollaborator = collab.collaboratorId === session.sub

  if (!isInitiator && !isCollaborator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const role = isInitiator ? 'initiator' : 'collaborator'

  if (role === 'initiator' && handshake.initiatorSignature) {
    return NextResponse.json({ error: 'Already signed' }, { status: 400 })
  }
  if (role === 'collaborator' && handshake.collaboratorSignature) {
    return NextResponse.json({ error: 'Already signed' }, { status: 400 })
  }

  // Sign it
  const updatedHandshake = await signHandshake(handshake.id, session.sub, signature, role)

  // Check if fully signed
  if (updatedHandshake.initiatorSignature && updatedHandshake.collaboratorSignature) {
    // Generate PDF
    const buffer = await generateHandshakePDF({
      title: collab.listing.project.title,
      projectDescription: updatedHandshake.projectDescription,
      collaboratorRole: updatedHandshake.collaboratorRole,
      ipClause: updatedHandshake.ipClause,
      creditAgreement: updatedHandshake.creditAgreement,
      exitClause: updatedHandshake.exitClause,
      confidentiality: updatedHandshake.confidentiality,
      milestoneSchedule: updatedHandshake.milestoneSchedule,
      initiatorName: updatedHandshake.initiatorSignature,
      initiatorSignedAt: updatedHandshake.initiatorSignedAt!,
      collaboratorName: updatedHandshake.collaboratorSignature,
      collaboratorSignedAt: updatedHandshake.collaboratorSignedAt!,
    })

    const hash = computePdfHash(buffer)
    const key = `agreements/${handshake.id}-${role}-signed.txt`
    const s3Path = await uploadToS3(buffer, key)

    // Save S3 key and Hash
    await updateHandshakePdfInfo(handshake.id, s3Path, hash)

    // Activate the collaboration!
    await updateCollaborationStatus(collab.id, { status: 'Active' })
  }

  return NextResponse.json({ success: true })
}
