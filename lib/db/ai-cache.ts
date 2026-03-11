import { prisma } from './prisma'
import type { AITask } from '@/lib/validators/micro-task'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function getCachedTasks(
  projectId: string,
  cacheKey: string
): Promise<{ tasks: AITask[]; source: string } | null> {
  const row = await prisma.aiTaskCache.findUnique({
    where: { projectId_cacheKey: { projectId, cacheKey } },
  })

  if (!row) return null
  if (row.expiresAt < new Date()) {
    // Expired — delete and treat as a miss
    await prisma.aiTaskCache.delete({
      where: { projectId_cacheKey: { projectId, cacheKey } },
    })
    return null
  }

  const tasks: unknown = JSON.parse(row.tasksJson)
  return { tasks: tasks as AITask[], source: row.source }
}

export async function setCachedTasks(
  projectId: string,
  cacheKey: string,
  tasks: AITask[],
  source: 'ai' | 'template'
): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS)
  await prisma.aiTaskCache.upsert({
    where: { projectId_cacheKey: { projectId, cacheKey } },
    update: { tasksJson: JSON.stringify(tasks), source, expiresAt },
    create: { projectId, cacheKey, tasksJson: JSON.stringify(tasks), source, expiresAt },
  })
}
