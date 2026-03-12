jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/user')

import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/user/profile/route'
import { getSession, setSession } from '@/lib/auth/session'
import { updateUserProfile } from '@/lib/db/user'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockSetSession = setSession as jest.MockedFunction<typeof setSession>
const mockUpdateProfile = updateUserProfile as jest.MockedFunction<typeof updateUserProfile>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: false }
const updatedUser = { id: 'u1', email: 'user@example.com' }

const validBody = {
  name: 'Alice',
  bio: 'Developer',
  skillTags: ['TypeScript'],
  socialLinks: { github: 'https://github.com/alice' },
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PUT /api/user/profile', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(session as never)
    mockUpdateProfile.mockResolvedValue(updatedUser as never)
    mockSetSession.mockResolvedValue(undefined)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await PUT(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid profile data', async () => {
    const res = await PUT(makeRequest({ name: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with success on valid profile', async () => {
    const res = await PUT(makeRequest(validBody))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('updates profile and refreshes session with profileSetup=true', async () => {
    await PUT(makeRequest(validBody))
    expect(mockUpdateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ name: 'Alice' }))
    expect(mockSetSession).toHaveBeenCalledWith('u1', 'user@example.com', true)
  })
})
