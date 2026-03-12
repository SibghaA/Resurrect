jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/project')
jest.mock('@/lib/ai/micro-task-engine')

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/projects/[id]/tasks/generate/route'
import { getSession } from '@/lib/auth/session'
import { getProjectById } from '@/lib/db/project'
import { generateMicroTasks } from '@/lib/ai/micro-task-engine'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>
const mockGenerateTasks = generateMicroTasks as jest.MockedFunction<typeof generateMicroTasks>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const project = {
  id: 'p1',
  title: 'My App',
  description: 'App',
  domain: 'Web',
  contextSnapshot: '{}',
  statusLogs: [],
}
const generatedTasks = [{ id: 't1', title: 'Set up DB', status: 'pending' }]
const generateResult = {
  batchId: 'b1',
  tasks: generatedTasks,
  source: 'ai',
  usedThisMonth: 1,
  limit: 10,
  isProTier: false,
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/projects/p1/tasks/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/projects/[id]/tasks/generate', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetProjectById.mockResolvedValue(project as never)
    mockGenerateTasks.mockResolvedValue(generateResult as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await POST(makeRequest({ targetMilestone: 'Deploy' }), { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when project not found', async () => {
    mockGetProjectById.mockResolvedValue(null)
    const res = await POST(makeRequest({ targetMilestone: 'Deploy' }), { params: { id: 'bad' } })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid input', async () => {
    const res = await POST(makeRequest({ targetMilestone: '' }), { params: { id: 'p1' } })
    expect(res.status).toBe(400)
  })

  it('generates tasks and returns 201 with task list', async () => {
    const res = await POST(makeRequest({ targetMilestone: 'Deploy MVP', timeAvailability: 60 }), {
      params: { id: 'p1' },
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.tasks).toHaveLength(1)
    expect(mockGenerateTasks).toHaveBeenCalledWith(project, 'Deploy MVP', 60, 'u1')
  })

  it('returns 500 with error message when AI throws an Error', async () => {
    mockGenerateTasks.mockRejectedValue(new Error('AI error'))
    const res = await POST(makeRequest({ targetMilestone: 'Deploy' }), { params: { id: 'p1' } })
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('AI error')
  })

  it('returns 500 with fallback message when a non-Error is thrown', async () => {
    mockGenerateTasks.mockRejectedValue('raw string throw')
    const res = await POST(makeRequest({ targetMilestone: 'Deploy' }), { params: { id: 'p1' } })
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Failed to generate tasks')
  })
})
