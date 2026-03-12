jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/project')

import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/projects/route'
import { getSession } from '@/lib/auth/session'
import { createProject, getProjectsByUserId } from '@/lib/db/project'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockCreateProject = createProject as jest.MockedFunction<typeof createProject>
const mockGetProjects = getProjectsByUserId as jest.MockedFunction<typeof getProjectsByUserId>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const validProject = {
  title: 'My App',
  description: 'A cool app',
  domain: 'Web',
  effortRemaining: '1 week',
}
const createdProject = { id: 'p1', ...validProject, userId: 'u1', status: 'Active' }

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/projects', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockCreateProject.mockResolvedValue(createdProject as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await POST(makePostRequest(validProject))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid project data', async () => {
    const res = await POST(makePostRequest({ title: '' }))
    expect(res.status).toBe(400)
  })

  it('creates project and returns 201', async () => {
    const res = await POST(makePostRequest(validProject))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('p1')
    expect(mockCreateProject).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ title: 'My App' })
    )
  })
})

describe('GET /api/projects', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetProjects.mockResolvedValue([createdProject as never])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns list of projects', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0].id).toBe('p1')
    expect(mockGetProjects).toHaveBeenCalledWith('u1')
  })
})
