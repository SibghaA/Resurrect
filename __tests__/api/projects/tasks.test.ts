jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/project')
jest.mock('@/lib/db/micro-task')

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/projects/[id]/tasks/route'
import { getSession } from '@/lib/auth/session'
import { getProjectById } from '@/lib/db/project'
import { getMicroTasksByProject } from '@/lib/db/micro-task'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>
const mockGetTasks = getMicroTasksByProject as jest.MockedFunction<typeof getMicroTasksByProject>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const project = { id: 'p1', userId: 'u1', statusLogs: [] }
const tasks = [{ id: 't1', title: 'Do something', status: 'pending' }]

function makeRequest() {
  return new NextRequest('http://localhost/api/projects/p1/tasks')
}

describe('GET /api/projects/[id]/tasks', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetProjectById.mockResolvedValue(project as never)
    mockGetTasks.mockResolvedValue(tasks as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET(makeRequest(), { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when project not found', async () => {
    mockGetProjectById.mockResolvedValue(null)
    const res = await GET(makeRequest(), { params: { id: 'bad' } })
    expect(res.status).toBe(404)
  })

  it('returns tasks for the project', async () => {
    const res = await GET(makeRequest(), { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.tasks).toHaveLength(1)
    expect(data.tasks[0].id).toBe('t1')
    expect(mockGetTasks).toHaveBeenCalledWith('p1')
  })
})
