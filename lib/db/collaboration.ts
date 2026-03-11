import { prisma } from './prisma'

export function createCollaboration(
  listingId: string,
  initiatorId: string,
  collaboratorId: string,
  milestoneDeadline?: Date
) {
  return prisma.collaboration.create({
    data: { listingId, initiatorId, collaboratorId, milestoneDeadline },
    include: { listing: { select: { id: true, projectId: true } } },
  })
}

export function getCollaborationById(id: string) {
  return prisma.collaboration.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, projectId: true, userId: true } },
      flags: true,
    },
  })
}

export function getCollaborationsByUserId(userId: string) {
  return prisma.collaboration.findMany({
    where: {
      OR: [{ initiatorId: userId }, { collaboratorId: userId }],
    },
    include: {
      listing: { select: { id: true, projectId: true } },
      flags: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function updateCollaborationStatus(
  id: string,
  data: {
    status?: string
    lastCommunicationAt?: Date
    exitTriggeredAt?: Date
    handoffCompletedAt?: Date
  }
) {
  return prisma.collaboration.update({ where: { id }, data })
}

export function getCollaborationsForFlakeRate(userId: string) {
  return prisma.collaboration.findMany({
    where: {
      OR: [{ initiatorId: userId }, { collaboratorId: userId }],
      // Exclude ones still under active moderation (all flags are Pending)
      NOT: {
        flags: {
          some: { status: 'Pending' },
        },
      },
    },
    select: {
      id: true,
      status: true,
      milestoneDeadline: true,
      lastCommunicationAt: true,
      handoffCompletedAt: true,
      exitTriggeredAt: true,
    },
  })
}

export function createCollaborationFlag(
  collaborationId: string,
  raisedById: string,
  reason: string
) {
  return prisma.collaborationFlag.create({
    data: { collaborationId, raisedById, reason },
  })
}
