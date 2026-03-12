jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/project')
jest.mock('@/lib/db/micro-task')

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/projects/[id]/tasks/[taskId]/route'
import { getSession } from '@/lib/auth/session'
import { getProjectById } from '@/lib/db/project'
import { getMicroTaskById, updateMicroTask } from '@/lib/db/micro-task'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>
const mockGetTaskById = getMicroTaskById as jest.MockedFunction<typeof getMicroTaskById>
const mockUpdateTask = updateMicroTask as jest.MockedFunction<typeof updateMicroTask>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const project = { id: 'p1', userId: 'u1', statusLogs: [] }
const task = { id: 't1', projectId: 'p1', title: 'Old title', status: 'pending' }

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/projects/p1/tasks/t1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/projects/[id]/tasks/[taskId]', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetProjectById.mockResolvedValue(project as never)
    mockGetTaskById.mockResolvedValue(task as never)
    mockUpdateTask.mockResolvedValue({ ...task, status: 'accepted' } as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ status: 'accepted' }), { params: { id: 'p1', taskId: 't1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when project not found', async () => {
    mockGetProjectById.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ status: 'accepted' }), { params: { id: 'bad', taskId: 't1' } })
    expect(res.status).toBe(404)
  })

  it('returns 404 when task not found', async () => {
    mockGetTaskById.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ status: 'accepted' }), { params: { id: 'p1', taskId: 'bad' } })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Task not found')
  })

  it('returns 400 when no fields provided', async () => {
    const res = await PATCH(makeRequest({}), { params: { id: 'p1', taskId: 't1' } })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid status value', async () => {
    const res = await PATCH(makeRequest({ status: 'completed' }), { params: { id: 'p1', taskId: 't1' } })
    expect(res.status).toBe(400)
  })

  it('updates and returns the task', async () => {
    const res = await PATCH(makeRequest({ status: 'accepted' }), { params: { id: 'p1', taskId: 't1' } })
    expect(res.status).toBe(200)
    expect(mockUpdateTask).toHaveBeenCalledWith('t1', { status: 'accepted' })
  })

  it('updates title only', async () => {
    const res = await PATCH(makeRequest({ title: 'New title' }), { params: { id: 'p1', taskId: 't1' } })
    expect(res.status).toBe(200)
    expect(mockUpdateTask).toHaveBeenCalledWith('t1', { title: 'New title' })
  })
})
