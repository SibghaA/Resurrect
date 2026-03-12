jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/project')
jest.mock('@/lib/db/coop-listing')

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/coop-listings/route'
import { getSession } from '@/lib/auth/session'
import { getProjectById } from '@/lib/db/project'
import { getActiveCoopListings, getActiveListingByProjectId, createCoopListing } from '@/lib/db/coop-listing'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>
const mockGetActive = getActiveCoopListings as jest.MockedFunction<typeof getActiveCoopListings>
const mockGetActiveByProject = getActiveListingByProjectId as jest.MockedFunction<typeof getActiveListingByProjectId>
const mockCreate = createCoopListing as jest.MockedFunction<typeof createCoopListing>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const project = { id: 'p1', userId: 'u1', statusLogs: [] }
const listing = { id: 'l1', projectId: 'p1', userId: 'u1' }

const validBody = {
  projectId: 'p1',
  description: 'Need a designer',
  timeCommitment: '5 hrs/week',
  milestonePreview: 'Landing page MVP',
}

function makeGetRequest(url = 'http://localhost/api/coop-listings') {
  return new NextRequest(url)
}

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost/api/coop-listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/coop-listings', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetActive.mockResolvedValue([listing as never])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
  })

  it('returns list of active listings', async () => {
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0].id).toBe('l1')
  })

  it('passes status filter from query params', async () => {
    await GET(makeGetRequest('http://localhost/api/coop-listings?status=Open'))
    expect(mockGetActive).toHaveBeenCalledWith({ status: 'Open', search: undefined })
  })

  it('passes search filter from query params', async () => {
    await GET(makeGetRequest('http://localhost/api/coop-listings?search=designer'))
    expect(mockGetActive).toHaveBeenCalledWith({ status: undefined, search: 'designer' })
  })
})

describe('POST /api/coop-listings', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetProjectById.mockResolvedValue(project as never)
    mockGetActiveByProject.mockResolvedValue(null)
    mockCreate.mockResolvedValue(listing as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await POST(makePostRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    const res = await POST(makePostRequest({ projectId: 'p1' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when project not found or not owned', async () => {
    mockGetProjectById.mockResolvedValue(null)
    const res = await POST(makePostRequest(validBody))
    expect(res.status).toBe(404)
  })

  it('returns 409 when active listing already exists', async () => {
    mockGetActiveByProject.mockResolvedValue(listing as never)
    const res = await POST(makePostRequest(validBody))
    expect(res.status).toBe(409)
  })

  it('creates and returns listing with 201', async () => {
    const res = await POST(makePostRequest(validBody))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('l1')
    expect(mockCreate).toHaveBeenCalledWith('u1', expect.objectContaining({ projectId: 'p1' }))
  })
})
