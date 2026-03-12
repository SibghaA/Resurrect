jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/coop-listing')

import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '@/app/api/coop-listings/[id]/route'
import { getSession } from '@/lib/auth/session'
import { getCoopListingById, updateCoopListing, deleteCoopListing } from '@/lib/db/coop-listing'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetById = getCoopListingById as jest.MockedFunction<typeof getCoopListingById>
const mockUpdate = updateCoopListing as jest.MockedFunction<typeof updateCoopListing>
const mockDelete = deleteCoopListing as jest.MockedFunction<typeof deleteCoopListing>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const listing = {
  id: 'l1',
  userId: 'u1',
  projectId: 'p1',
  description: 'Need a designer',
  project: { title: 'My App', domain: 'Web', status: 'Active' },
  user: { id: 'u1', name: 'Alice', flakeRate: 0 },
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/coop-listings/l1')
}
function makePatchRequest(body: unknown) {
  return new NextRequest('http://localhost/api/coop-listings/l1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
function makeDeleteRequest() {
  return new NextRequest('http://localhost/api/coop-listings/l1', { method: 'DELETE' })
}

describe('GET /api/coop-listings/[id]', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetById.mockResolvedValue(listing as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET(makeGetRequest(), { params: { id: 'l1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when listing not found', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await GET(makeGetRequest(), { params: { id: 'bad' } })
    expect(res.status).toBe(404)
  })

  it('returns listing with project and user', async () => {
    const res = await GET(makeGetRequest(), { params: { id: 'l1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('l1')
    expect(data.project.title).toBe('My App')
  })
})

describe('PATCH /api/coop-listings/[id]', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetById.mockResolvedValue(listing as never)
    mockUpdate.mockResolvedValue({ ...listing, description: 'Updated' } as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await PATCH(makePatchRequest({ description: 'Updated' }), { params: { id: 'l1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when listing not found', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await PATCH(makePatchRequest({ description: 'Updated' }), { params: { id: 'bad' } })
    expect(res.status).toBe(404)
  })

  it('returns 403 when not the owner', async () => {
    mockGetSession.mockResolvedValue({
      sub: 'other-user',
      email: 'x@x.com',
      profileSetup: true,
    } as never)
    const res = await PATCH(makePatchRequest({ description: 'Updated' }), { params: { id: 'l1' } })
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid update data', async () => {
    const res = await PATCH(makePatchRequest({ status: 'InvalidStatus' }), { params: { id: 'l1' } })
    expect(res.status).toBe(400)
  })

  it('updates and returns listing', async () => {
    const res = await PATCH(makePatchRequest({ description: 'Updated' }), { params: { id: 'l1' } })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith('l1', { description: 'Updated' })
  })
})

describe('DELETE /api/coop-listings/[id]', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetById.mockResolvedValue(listing as never)
    mockDelete.mockResolvedValue(listing as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await DELETE(makeDeleteRequest(), { params: { id: 'l1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when listing not found', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await DELETE(makeDeleteRequest(), { params: { id: 'bad' } })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Listing not found')
  })

  it('returns 403 when not the owner', async () => {
    mockGetSession.mockResolvedValue({
      sub: 'other',
      email: 'x@x.com',
      profileSetup: true,
    } as never)
    const res = await DELETE(makeDeleteRequest(), { params: { id: 'l1' } })
    expect(res.status).toBe(403)
  })

  it('deletes and returns success', async () => {
    const res = await DELETE(makeDeleteRequest(), { params: { id: 'l1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith('l1')
  })
})
