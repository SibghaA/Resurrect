import { prisma } from './prisma'
import type { AITask } from '@/lib/validators/micro-task'

export async function createMicroTaskBatch(projectId: string, batchId: string, tasks: AITask[]) {
  return prisma.microTask.createMany({
    data: tasks.map((task, index) => ({
      projectId,
      batchId,
      taskId: task.task_id,
      title: task.title,
      description: task.description,
      estimatedMinutes: task.estimated_minutes,
      category: task.category,
      dependencies: JSON.stringify(task.dependencies),
      order: index,
      status: 'pending',
    })),
  })
}

export async function getMicroTasksByProject(projectId: string) {
  return prisma.microTask.findMany({
    where: {
      projectId,
      status: { not: 'dismissed' },
    },
    orderBy: { order: 'asc' },
  })
}

export async function getMicroTaskById(taskDbId: string, projectId: string) {
  return prisma.microTask.findFirst({
    where: { id: taskDbId, projectId },
  })
}

export async function updateMicroTask(
  taskDbId: string,
  data: { status?: string; title?: string; description?: string }
) {
  return prisma.microTask.update({
    where: { id: taskDbId },
    data,
  })
}

export async function deleteAllMicroTasks(projectId: string) {
  return prisma.microTask.deleteMany({
    where: { projectId },
  })
}
