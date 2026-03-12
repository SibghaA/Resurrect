jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/user')

import { GET } from '@/app/api/user/me/route'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/db/user'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>

const session = { sub: 'u1', email: 'user@example.com', profileSetup: true }
const dbUser = {
  id: 'u1',
  email: 'user@example.com',
  name: 'Alice',
  bio: 'Developer',
  skillTags: '["TypeScript"]',
  socialLinks: '{"github":"https://github.com/alice"}',
  flakeRate: 0,
  profileSetup: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('GET /api/user/me', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 404 when user not found in DB', async () => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetUserById.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(404)
  })

  it('returns parsed user data on success', async () => {
    mockGetSession.mockResolvedValue(session as never)
    mockGetUserById.mockResolvedValue(dbUser as never)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('u1')
    expect(data.skillTags).toEqual(['TypeScript'])
    expect(data.socialLinks).toEqual({ github: 'https://github.com/alice' })
    expect(data.flakeRate).toBe(0)
  })
})
