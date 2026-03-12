jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    microTask: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/db/prisma'
import {
  createMicroTaskBatch,
  getMicroTasksByProject,
  getMicroTaskById,
  updateMicroTask,
  deleteAllMicroTasks,
} from '@/lib/db/micro-task'
import type { AITask } from '@/lib/validators/micro-task'

const mockMicroTask = prisma.microTask as jest.Mocked<typeof prisma.microTask>

const tasks: AITask[] = [
  {
    task_id: 1,
    title: 'Set up DB',
    description: 'Create schema',
    estimated_minutes: 10,
    category: 'setup',
    dependencies: [],
  },
  {
    task_id: 2,
    title: 'Write tests',
    description: 'Add unit tests',
    estimated_minutes: 15,
    category: 'test',
    dependencies: [1],
  },
]

describe('createMicroTaskBatch', () => {
  it('calls createMany with correct mapped data', async () => {
    mockMicroTask.createMany.mockResolvedValue({ count: 2 })
    await createMicroTaskBatch('p1', 'batch-1', tasks)
    expect(mockMicroTask.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          projectId: 'p1',
          batchId: 'batch-1',
          taskId: 1,
          title: 'Set up DB',
          order: 0,
          status: 'pending',
          dependencies: '[]',
        }),
        expect.objectContaining({
          taskId: 2,
          order: 1,
          dependencies: JSON.stringify([1]),
        }),
      ],
    })
  })
})

describe('getMicroTasksByProject', () => {
  it('excludes dismissed tasks and orders by asc', async () => {
    mockMicroTask.findMany.mockResolvedValue([])
    await getMicroTasksByProject('p1')
    expect(mockMicroTask.findMany).toHaveBeenCalledWith({
      where: { projectId: 'p1', status: { not: 'dismissed' } },
      orderBy: { order: 'asc' },
    })
  })
})

describe('getMicroTaskById', () => {
  it('queries by id and projectId', async () => {
    mockMicroTask.findFirst.mockResolvedValue(null)
    await getMicroTaskById('task-1', 'p1')
    expect(mockMicroTask.findFirst).toHaveBeenCalledWith({
      where: { id: 'task-1', projectId: 'p1' },
    })
  })
})

describe('updateMicroTask', () => {
  it('updates with provided data', async () => {
    mockMicroTask.update.mockResolvedValue({} as never)
    await updateMicroTask('task-1', { status: 'accepted', title: 'New title' })
    expect(mockMicroTask.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { status: 'accepted', title: 'New title' },
    })
  })
})

describe('deleteAllMicroTasks', () => {
  it('deletes all tasks for a project', async () => {
    mockMicroTask.deleteMany.mockResolvedValue({ count: 5 })
    await deleteAllMicroTasks('p1')
    expect(mockMicroTask.deleteMany).toHaveBeenCalledWith({
      where: { projectId: 'p1' },
    })
  })
})
