jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/coop-listing')

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/coop-listings/[id]/deactivate/route'
import { getSession } from '@/lib/auth/session'
import { getCoopListingById, deactivateCoopListing } from '@/lib/db/coop-listing'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetById = getCoopListingById as jest.MockedFunction<typeof getCoopListingById>
const mockDeactivate = deactivateCoopListing as jest.MockedFunction<typeof deactivateCoopListing>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const listing = { id: 'l1', userId: 'u1', active: true }
const deactivated = { id: 'l1', userId: 'u1', active: false }

function makeRequest() {
  return new NextRequest('http://localhost/api/coop-listings/l1/deactivate', { method: 'PATCH' })
}

describe('PATCH /api/coop-listings/[id]/deactivate', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetById.mockResolvedValue(listing as never)
    mockDeactivate.mockResolvedValue(deactivated as never)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await PATCH(makeRequest(), { params: { id: 'l1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when listing not found', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await PATCH(makeRequest(), { params: { id: 'bad' } })
    expect(res.status).toBe(404)
  })

  it('returns 403 when not the owner', async () => {
    mockGetSession.mockResolvedValue({
      sub: 'other',
      email: 'x@x.com',
      profileSetup: true,
    } as never)
    const res = await PATCH(makeRequest(), { params: { id: 'l1' } })
    expect(res.status).toBe(403)
  })

  it('deactivates and returns updated listing', async () => {
    const res = await PATCH(makeRequest(), { params: { id: 'l1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.active).toBe(false)
    expect(mockDeactivate).toHaveBeenCalledWith('l1')
  })
})
