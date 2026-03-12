jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/db/prisma'
import { createUser, getUserByEmail, getUserById, updateUserProfile } from '@/lib/db/user'

const mockUser = prisma.user as jest.Mocked<typeof prisma.user>

describe('createUser', () => {
  it('calls prisma.user.create with email and passwordHash', async () => {
    mockUser.create.mockResolvedValue({ id: 'u1', email: 'a@b.com' } as never)
    await createUser('a@b.com', 'hashed')
    expect(mockUser.create).toHaveBeenCalledWith({
      data: { email: 'a@b.com', passwordHash: 'hashed' },
    })
  })
})

describe('getUserByEmail', () => {
  it('calls prisma.user.findUnique with email', async () => {
    mockUser.findUnique.mockResolvedValue(null)
    await getUserByEmail('a@b.com')
    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } })
  })
})

describe('getUserById', () => {
  it('calls prisma.user.findUnique with id', async () => {
    mockUser.findUnique.mockResolvedValue(null)
    await getUserById('u1')
    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } })
  })
})

describe('updateUserProfile', () => {
  it('JSON-stringifies skillTags and socialLinks and sets profileSetup true', async () => {
    mockUser.update.mockResolvedValue({ id: 'u1' } as never)
    await updateUserProfile('u1', {
      name: 'Alice',
      bio: 'Dev',
      skillTags: ['TypeScript'],
      socialLinks: { github: 'https://github.com/alice', twitter: '' },
    })
    expect(mockUser.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        name: 'Alice',
        bio: 'Dev',
        skillTags: JSON.stringify(['TypeScript']),
        socialLinks: JSON.stringify({ github: 'https://github.com/alice' }), // empty twitter filtered out
        profileSetup: true,
      },
    })
  })

  it('filters out empty social link values', async () => {
    mockUser.update.mockResolvedValue({ id: 'u1' } as never)
    await updateUserProfile('u1', {
      name: 'Bob',
      bio: '',
      skillTags: [],
      socialLinks: { github: '', twitter: '', website: '' },
    })
    const call = mockUser.update.mock.calls[0][0]
    expect(JSON.parse(call.data.socialLinks as string)).toEqual({})
  })
})
