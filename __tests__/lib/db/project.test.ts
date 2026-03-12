jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    statusLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '@/lib/db/prisma'
import {
  createProject,
  getProjectsByUserId,
  getProjectById,
  updateProjectStatus,
  updateContextSnapshot,
  getStatusLogs,
} from '@/lib/db/project'

const mockProject = prisma.project as jest.Mocked<typeof prisma.project>
const mockStatusLog = prisma.statusLog as jest.Mocked<typeof prisma.statusLog>
const mockTransaction = prisma.$transaction as jest.Mock

const projectData = {
  title: 'My App',
  description: 'A cool app',
  domain: 'Web',
  effortRemaining: '1 week',
  status: 'Active' as const,
}

describe('createProject', () => {
  it('calls prisma.project.create with userId and data', async () => {
    mockProject.create.mockResolvedValue({ id: 'p1', ...projectData } as never)
    await createProject('u1', projectData)
    expect(mockProject.create).toHaveBeenCalledWith({
      data: { ...projectData, userId: 'u1' },
    })
  })
})

describe('getProjectsByUserId', () => {
  it('queries by userId ordered by createdAt desc', async () => {
    mockProject.findMany.mockResolvedValue([])
    await getProjectsByUserId('u1')
    expect(mockProject.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: { createdAt: 'desc' },
    })
  })
})

describe('getProjectById', () => {
  it('returns null when project does not exist', async () => {
    mockProject.findUnique.mockResolvedValue(null)
    const result = await getProjectById('p1', 'u1')
    expect(result).toBeNull()
    expect(mockProject.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1' } })
    )
  })

  it('returns project when user is the owner', async () => {
    const fakeProject = {
      id: 'p1',
      userId: 'u1',
      coopListing: null,
    }
    mockProject.findUnique.mockResolvedValue(fakeProject as never)
    const result = await getProjectById('p1', 'u1')
    expect(result).toBe(fakeProject)
  })
})

describe('updateProjectStatus', () => {
  it('calls $transaction with project update and statusLog create', async () => {
    const fakeProject = { id: 'p1', status: 'Paused' }
    const fakeLog = { id: 'l1' }
    mockProject.update.mockResolvedValue(fakeProject as never)
    mockStatusLog.create.mockResolvedValue(fakeLog as never)
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops))

    await updateProjectStatus('p1', 'Active', 'Paused', 'Taking a break')

    expect(mockProject.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { status: 'Paused' },
    })
    expect(mockStatusLog.create).toHaveBeenCalledWith({
      data: { projectId: 'p1', fromStatus: 'Active', toStatus: 'Paused', notes: 'Taking a break' },
    })
    expect(mockTransaction).toHaveBeenCalled()
  })
})

describe('updateContextSnapshot', () => {
  it('JSON-stringifies the snapshot and updates the project', async () => {
    mockProject.update.mockResolvedValue({ id: 'p1' } as never)
    const snapshot = { currentState: 'In progress', blockers: '', nextSteps: 'Deploy' }
    await updateContextSnapshot('p1', snapshot)
    expect(mockProject.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { contextSnapshot: JSON.stringify(snapshot) },
    })
  })
})

describe('getStatusLogs', () => {
  it('queries statusLogs by projectId ordered desc', async () => {
    mockStatusLog.findMany.mockResolvedValue([])
    await getStatusLogs('p1')
    expect(mockStatusLog.findMany).toHaveBeenCalledWith({
      where: { projectId: 'p1' },
      orderBy: { createdAt: 'desc' },
    })
  })
})
