jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/project')

import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/projects/[id]/status/route'
import { getSession } from '@/lib/auth/session'
import { getProjectById, updateProjectStatus } from '@/lib/db/project'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>
const mockUpdateStatus = updateProjectStatus as jest.MockedFunction<typeof updateProjectStatus>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const project = { id: 'p1', status: 'Active', userId: 'u1', statusLogs: [] }

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/projects/p1/status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PUT /api/projects/[id]/status', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetProjectById.mockResolvedValue(project as never)
    mockUpdateStatus.mockResolvedValue([{}, {}] as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await PUT(makeRequest({ status: 'Paused' }), { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when project not found', async () => {
    mockGetProjectById.mockResolvedValue(null)
    const res = await PUT(makeRequest({ status: 'Paused' }), { params: { id: 'bad' } })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status', async () => {
    const res = await PUT(makeRequest({ status: 'Abandoned' }), { params: { id: 'p1' } })
    expect(res.status).toBe(400)
  })

  it('returns 400 when status unchanged', async () => {
    const res = await PUT(makeRequest({ status: 'Active' }), { params: { id: 'p1' } })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Project is already in this status')
  })

  it('updates status and returns new status', async () => {
    const res = await PUT(makeRequest({ status: 'Paused', notes: 'Taking a break' }), {
      params: { id: 'p1' },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('Paused')
    expect(mockUpdateStatus).toHaveBeenCalledWith('p1', 'Active', 'Paused', 'Taking a break')
  })
})
