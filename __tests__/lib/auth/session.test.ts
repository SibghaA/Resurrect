jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

import { cookies } from 'next/headers'
import { setSession, getSession, clearSession } from '@/lib/auth/session'
import { signToken } from '@/lib/auth/jwt'

const mockCookies = cookies as jest.Mock

let mockCookieStore: { set: jest.Mock; get: jest.Mock; delete: jest.Mock }

beforeEach(() => {
  mockCookieStore = { set: jest.fn(), get: jest.fn(), delete: jest.fn() }
  mockCookies.mockReturnValue(mockCookieStore)
})

describe('setSession', () => {
  it('sets an httpOnly cookie with the token', async () => {
    await setSession('user-1', 'user@example.com', false)
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    )
  })
})

describe('getSession', () => {
  it('returns null when no cookie is set', async () => {
    mockCookieStore.get.mockReturnValue(undefined)
    const session = await getSession()
    expect(session).toBeNull()
  })

  it('returns token payload for a valid cookie', async () => {
    const token = await signToken({ sub: 'user-1', email: 'a@b.com', profileSetup: true })
    mockCookieStore.get.mockReturnValue({ value: token })
    const session = await getSession()
    expect(session?.sub).toBe('user-1')
    expect(session?.email).toBe('a@b.com')
    expect(session?.profileSetup).toBe(true)
  })

  it('returns null for an invalid/tampered token', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'invalid.token.here' })
    const session = await getSession()
    expect(session).toBeNull()
  })
})

describe('clearSession', () => {
  it('deletes the token cookie', () => {
    clearSession()
    expect(mockCookieStore.delete).toHaveBeenCalledWith('token')
  })
})
