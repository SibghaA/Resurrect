import { createUser, getUserByEmail, getUserById } from '@/lib/db/user'
import { cleanDatabase, prisma } from './helpers/db'

beforeAll(async () => {
  await cleanDatabase()
})

afterAll(async () => {
  await cleanDatabase()
  await prisma.$disconnect()
})

describe('auth DB helpers', () => {
  const testEmail = 'integration-auth@example.com'
  const testPasswordHash = '$2a$10$hashedpasswordfortesting'
  let createdUserId: string

  describe('createUser', () => {
    it('creates a user and returns the correct shape', async () => {
      const user = await createUser(testEmail, testPasswordHash)
      expect(user).toMatchObject({
        email: testEmail,
        passwordHash: testPasswordHash,
        profileSetup: false,
        tier: 'free',
        flakeRate: 0,
        aiCallsThisMonth: 0,
      })
      expect(typeof user.id).toBe('string')
      expect(user.id.length).toBeGreaterThan(0)
      createdUserId = user.id
    })
  })

  describe('getUserByEmail', () => {
    it('returns the user when a matching email exists', async () => {
      const user = await getUserByEmail(testEmail)
      expect(user).not.toBeNull()
      expect(user?.email).toBe(testEmail)
      expect(user?.id).toBe(createdUserId)
      expect(user?.passwordHash).toBe(testPasswordHash)
    })

    it('returns null for a non-existent email', async () => {
      const user = await getUserByEmail('nonexistent@example.com')
      expect(user).toBeNull()
    })
  })

  describe('getUserById', () => {
    it('returns the user when a matching id exists', async () => {
      const user = await getUserById(createdUserId)
      expect(user).not.toBeNull()
      expect(user?.id).toBe(createdUserId)
      expect(user?.email).toBe(testEmail)
    })

    it('returns null for a non-existent id', async () => {
      const user = await getUserById('nonexistent-id-00000000')
      expect(user).toBeNull()
    })
  })
})
