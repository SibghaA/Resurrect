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

export function getProjectById(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      statusLogs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
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
