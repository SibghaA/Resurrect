import { prisma } from './prisma'

export interface HandshakeInput {
  collaborationId: string
  projectDescription: string
  collaboratorRole: string
  ipClause: string
  customIpClause?: string
  creditAgreement: string
  exitClause?: string
  confidentiality?: string
  milestoneSchedule: string
}

export function createHandshakeAgreement(data: HandshakeInput) {
  return prisma.handshakeAgreement.create({
    data: {
      ...data,
      exitClause: data.exitClause || '48hr notice + handoff doc',
      confidentiality: data.confidentiality || 'Standard NDA',
    },
  })
}

export function getHandshakeByCollaborationId(collaborationId: string) {
  return prisma.handshakeAgreement.findUnique({
    where: { collaborationId },
    include: {
      collaboration: {
        include: {
          initiator: { select: { id: true, name: true, email: true } },
          collaborator: { select: { id: true, name: true, email: true } },
          listing: { select: { project: { select: { title: true } } } },
        },
      },
    },
  })
}

export function updateHandshakeAgreement(
  id: string,
  data: Partial<Omit<HandshakeInput, 'collaborationId'>>
) {
  return prisma.handshakeAgreement.update({
    where: { id },
    data,
  })
}

export function signHandshake(
  id: string,
  userId: string,
  signature: string,
  role: 'initiator' | 'collaborator'
) {
  const data =
    role === 'initiator'
      ? { initiatorSignature: signature, initiatorSignedAt: new Date() }
      : { collaboratorSignature: signature, collaboratorSignedAt: new Date() }

  return prisma.handshakeAgreement.update({
    where: { id },
    data,
    include: {
      collaboration: true,
    },
  })
}

export function updateHandshakePdfInfo(id: string, pdfS3Key: string, pdfHash: string) {
  return prisma.handshakeAgreement.update({
    where: { id },
    data: { pdfS3Key, pdfHash },
  })
}
