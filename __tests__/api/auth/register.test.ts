jest.mock('@/lib/db/user')
jest.mock('@/lib/auth/password')
jest.mock('@/lib/auth/session')

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/register/route'
import { getUserByEmail, createUser } from '@/lib/db/user'
import { hashPassword } from '@/lib/auth/password'
import { setSession } from '@/lib/auth/session'

const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>
const mockSetSession = setSession as jest.MockedFunction<typeof setSession>

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    mockGetUserByEmail.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue('hashed-password')
    mockCreateUser.mockResolvedValue({ id: 'u1', email: 'new@example.com' } as never)
    mockSetSession.mockResolvedValue(undefined)
  })

  it('returns 200 with success on valid registration', async () => {
    const res = await POST(makeRequest({ email: 'new@example.com', password: 'password123' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('returns 400 for invalid email', async () => {
    const res = await POST(makeRequest({ email: 'bad-email', password: 'password123' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for short password', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', password: 'short' }))
    expect(res.status).toBe(400)
  })

  it('returns 409 when email already in use', async () => {
    mockGetUserByEmail.mockResolvedValue({ id: 'u-existing' } as never)
    const res = await POST(makeRequest({ email: 'existing@example.com', password: 'password123' }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('Email already in use')
  })

  it('hashes the password before creating user', async () => {
    await POST(makeRequest({ email: 'new@example.com', password: 'password123' }))
    expect(mockHashPassword).toHaveBeenCalledWith('password123')
    expect(mockCreateUser).toHaveBeenCalledWith('new@example.com', 'hashed-password')
  })

  it('sets session after creating user', async () => {
    await POST(makeRequest({ email: 'new@example.com', password: 'password123' }))
    expect(mockSetSession).toHaveBeenCalledWith('u1', 'new@example.com', false)
  })
})
