jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/project')

import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/projects/[id]/context/route'
import { getSession } from '@/lib/auth/session'
import { getProjectById, updateContextSnapshot } from '@/lib/db/project'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>
const mockUpdateSnapshot = updateContextSnapshot as jest.MockedFunction<
  typeof updateContextSnapshot
>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const project = { id: 'p1', userId: 'u1', statusLogs: [] }
const updatedProject = { id: 'p1', contextSnapshot: '{"currentState":"In progress"}' }

const validSnapshot = { currentState: 'In progress', blockers: 'None', nextSteps: 'Deploy' }

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/projects/p1/context', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PUT /api/projects/[id]/context', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetProjectById.mockResolvedValue(project as never)
    mockUpdateSnapshot.mockResolvedValue(updatedProject as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await PUT(makeRequest(validSnapshot), { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when project not found', async () => {
    mockGetProjectById.mockResolvedValue(null)
    const res = await PUT(makeRequest(validSnapshot), { params: { id: 'bad' } })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid snapshot (field too long)', async () => {
    const res = await PUT(makeRequest({ currentState: 'x'.repeat(1001) }), { params: { id: 'p1' } })
    expect(res.status).toBe(400)
  })

  it('saves snapshot and returns updated project', async () => {
    const res = await PUT(makeRequest(validSnapshot), { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    expect(mockUpdateSnapshot).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ currentState: 'In progress' })
    )
  })

  it('accepts empty snapshot (all defaults)', async () => {
    const res = await PUT(makeRequest({}), { params: { id: 'p1' } })
    expect(res.status).toBe(200)
  })
})
