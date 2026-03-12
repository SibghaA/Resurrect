import { signToken, verifyToken, type TokenPayload } from '@/lib/auth/jwt'

const payload: TokenPayload = {
  sub: 'user-123',
  email: 'user@example.com',
  profileSetup: true,
}

describe('signToken', () => {
  it('returns a JWT string', async () => {
    const token = await signToken(payload)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('verifyToken', () => {
  it('returns the original payload after signing', async () => {
    const token = await signToken(payload)
    const verified = await verifyToken(token)
    expect(verified.sub).toBe(payload.sub)
    expect(verified.email).toBe(payload.email)
    expect(verified.profileSetup).toBe(payload.profileSetup)
  })

  it('throws on an invalid token', async () => {
    await expect(verifyToken('not.a.jwt')).rejects.toThrow()
  })

  it('throws on a token signed with a different secret', async () => {
    // Manually craft a token with wrong secret — just use a garbage string
    await expect(verifyToken('eyJhbGciOiJIUzI1NiJ9.e30.bad-signature')).rejects.toThrow()
  })

  it('roundtrips profileSetup false', async () => {
    const token = await signToken({ ...payload, profileSetup: false })
    const verified = await verifyToken(token)
    expect(verified.profileSetup).toBe(false)
  })
})
