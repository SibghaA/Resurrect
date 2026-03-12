jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/project')

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/projects/[id]/route'
import { getSession } from '@/lib/auth/session'
import { getProjectById } from '@/lib/db/project'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const project = { id: 'p1', title: 'My App', userId: 'u1', statusLogs: [] }

function makeRequest() {
  return new NextRequest('http://localhost/api/projects/p1')
}

describe('GET /api/projects/[id]', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetProjectById.mockResolvedValue(project as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET(makeRequest(), { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when project not found', async () => {
    mockGetProjectById.mockResolvedValue(null)
    const res = await GET(makeRequest(), { params: { id: 'unknown' } })
    expect(res.status).toBe(404)
  })

  it('returns project with statusLogs', async () => {
    const res = await GET(makeRequest(), { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('p1')
    expect(mockGetProjectById).toHaveBeenCalledWith('p1', 'u1')
  })
})
