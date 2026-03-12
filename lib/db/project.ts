import { prisma } from './prisma'
import type { ProjectInput, ContextSnapshotInput } from '@/lib/validators/project'

export function createProject(userId: string, data: ProjectInput) {
  return prisma.project.create({
    data: {
      ...data,
      userId,
    },
  })
}

export function getProjectsByUserId(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProjectById(projectId: string, userId: string) {
  // Find project first
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      statusLogs: { orderBy: { createdAt: 'desc' } },
      coopListing: {
        include: {
          collaborations: {
            where: {
              OR: [{ initiatorId: userId }, { collaboratorId: userId }],
            },
          },
        },
      },
    },
  })

  if (!project) return null

  const isOwner = project.userId === userId
  let hasAccess = false

  if (isOwner) {
    // Owner has access unless they have a Pending Handshake on this project
    const hasPendingHandshake = project.coopListing?.collaborations.some(
      (c) => c.status === 'Pending Handshake'
    )
    hasAccess = !hasPendingHandshake
  } else {
    // Non-owner has access ONLY IF they have an Active (fully signed) collaboration
    const hasActiveCollab = project.coopListing?.collaborations.some((c) => c.status === 'Active')
    hasAccess = !!hasActiveCollab
  }

  if (!hasAccess) return null
  return project
}

export function updateProjectStatus(
  projectId: string,
  fromStatus: string,
  toStatus: string,
  notes?: string
) {
  return prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: { status: toStatus },
    }),
    prisma.statusLog.create({
      data: {
        projectId,
        fromStatus,
        toStatus,
        notes,
      },
    }),
  ])
}

export function updateContextSnapshot(projectId: string, snapshot: ContextSnapshotInput) {
  return prisma.project.update({
    where: { id: projectId },
    data: { contextSnapshot: JSON.stringify(snapshot) },
  })
}

export function getStatusLogs(projectId: string) {
  return prisma.statusLog.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })
}
