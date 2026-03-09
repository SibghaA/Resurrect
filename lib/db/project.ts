import { prisma } from './prisma'
import type { ProjectInput } from '@/lib/validators/project'

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
