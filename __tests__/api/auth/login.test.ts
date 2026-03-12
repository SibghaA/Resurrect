jest.mock('@/lib/db/user')
jest.mock('@/lib/auth/password')
jest.mock('@/lib/auth/session')

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'
import { getUserByEmail } from '@/lib/db/user'
import { verifyPassword } from '@/lib/auth/password'
import { setSession } from '@/lib/auth/session'

const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>
const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>
const mockSetSession = setSession as jest.MockedFunction<typeof setSession>

const existingUser = {
  id: 'u1',
  email: 'user@example.com',
  passwordHash: 'hashed',
  profileSetup: true,
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    mockGetUserByEmail.mockResolvedValue(existingUser as never)
    mockVerifyPassword.mockResolvedValue(true)
    mockSetSession.mockResolvedValue(undefined)
  })

  it('returns 200 with profileSetup on valid credentials', async () => {
    const res = await POST(makeRequest({ email: 'user@example.com', password: 'password123' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.profileSetup).toBe(true)
  })

  it('returns 400 for invalid input', async () => {
    const res = await POST(makeRequest({ email: 'bad', password: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 401 when user not found', async () => {
    mockGetUserByEmail.mockResolvedValue(null)
    const res = await POST(makeRequest({ email: 'nobody@example.com', password: 'password123' }))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Invalid email or password')
  })

  it('returns 401 when password is wrong', async () => {
    mockVerifyPassword.mockResolvedValue(false)
    const res = await POST(makeRequest({ email: 'user@example.com', password: 'wrong' }))
    expect(res.status).toBe(401)
  })

  it('sets session with correct profileSetup flag', async () => {
    await POST(makeRequest({ email: 'user@example.com', password: 'password123' }))
    expect(mockSetSession).toHaveBeenCalledWith('u1', 'user@example.com', true)
  })
})
