import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('hashPassword', () => {
  it('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('mysecret')
    expect(typeof hash).toBe('string')
    expect(hash).toMatch(/^\$2[ab]\$10\$/)
  })

  it('produces different hashes for the same password', async () => {
    const hash1 = await hashPassword('mysecret')
    const hash2 = await hashPassword('mysecret')
    expect(hash1).not.toBe(hash2)
  })
})

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('correct-password')
    await expect(verifyPassword('correct-password', hash)).resolves.toBe(true)
  })

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('correct-password')
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false)
  })

  it('returns false for empty string against real hash', async () => {
    const hash = await hashPassword('real-password')
    await expect(verifyPassword('', hash)).resolves.toBe(false)
  })
})
