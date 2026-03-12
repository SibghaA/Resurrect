jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    coopListing: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { getCoopListingsByUserId, getActiveListingByProjectId } from '@/lib/db/coop-listing'

import { prisma } from '@/lib/db/prisma'
import {
  createCoopListing,
  getCoopListingById,
  getActiveCoopListings,
  updateCoopListing,
  deactivateCoopListing,
  deleteCoopListing,
} from '@/lib/db/coop-listing'

const mockCoop = prisma.coopListing as jest.Mocked<typeof prisma.coopListing>

const listingInput = {
  projectId: 'p1',
  description: 'Need a designer',
  domainTags: ['Web'],
  skillTagsHave: ['TypeScript'],
  skillTagsNeed: ['Figma'],
  timeCommitment: '5 hrs/week',
  milestonePreview: 'Landing page',
  visibility: 'Open to All' as const,
}

describe('createCoopListing', () => {
  it('JSON-stringifies array fields on create', async () => {
    mockCoop.create.mockResolvedValue({} as never)
    await createCoopListing('u1', listingInput)
    expect(mockCoop.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        projectId: 'p1',
        domainTags: JSON.stringify(['Web']),
        skillTagsHave: JSON.stringify(['TypeScript']),
        skillTagsNeed: JSON.stringify(['Figma']),
      }),
    })
  })
})

describe('getCoopListingById', () => {
  it('finds unique by id with project and user includes', async () => {
    mockCoop.findUnique.mockResolvedValue(null)
    await getCoopListingById('listing-1')
    expect(mockCoop.findUnique).toHaveBeenCalledWith({
      where: { id: 'listing-1' },
      include: {
        project: { select: { title: true, domain: true, status: true } },
        user: { select: { id: true, name: true, flakeRate: true } },
      },
    })
  })
})

describe('getActiveCoopListings', () => {
  it('filters by active:true with no extra filters', async () => {
    mockCoop.findMany.mockResolvedValue([])
    await getActiveCoopListings()
    const call = mockCoop.findMany.mock.calls[0][0]
    expect(call.where.active).toBe(true)
  })

  it('applies status filter when provided', async () => {
    mockCoop.findMany.mockResolvedValue([])
    await getActiveCoopListings({ status: 'Open' })
    const call = mockCoop.findMany.mock.calls[0][0]
    expect(call.where.status).toBe('Open')
  })

  it('applies search filter when provided', async () => {
    mockCoop.findMany.mockResolvedValue([])
    await getActiveCoopListings({ search: 'designer' })
    const call = mockCoop.findMany.mock.calls[0][0]
    expect(call.where.OR).toBeDefined()
  })
})

describe('updateCoopListing', () => {
  it('only includes fields that are provided', async () => {
    mockCoop.update.mockResolvedValue({} as never)
    await updateCoopListing('l1', { description: 'New desc', status: 'Filled' })
    const call = mockCoop.update.mock.calls[0][0]
    expect(call.data.description).toBe('New desc')
    expect(call.data.status).toBe('Filled')
    expect(call.data.domainTags).toBeUndefined()
  })

  it('JSON-stringifies array fields when present', async () => {
    mockCoop.update.mockResolvedValue({} as never)
    await updateCoopListing('l1', { domainTags: ['React'], skillTagsNeed: ['CSS'] })
    const call = mockCoop.update.mock.calls[0][0]
    expect(call.data.domainTags).toBe(JSON.stringify(['React']))
    expect(call.data.skillTagsNeed).toBe(JSON.stringify(['CSS']))
  })
})

describe('deactivateCoopListing', () => {
  it('sets active to false', async () => {
    mockCoop.update.mockResolvedValue({} as never)
    await deactivateCoopListing('l1')
    expect(mockCoop.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: { active: false },
    })
  })
})

describe('deleteCoopListing', () => {
  it('deletes by id', async () => {
    mockCoop.delete.mockResolvedValue({} as never)
    await deleteCoopListing('l1')
    expect(mockCoop.delete).toHaveBeenCalledWith({ where: { id: 'l1' } })
  })
})

describe('getCoopListingsByUserId', () => {
  it('queries by userId with project include ordered desc', async () => {
    mockCoop.findMany.mockResolvedValue([])
    await getCoopListingsByUserId('u1')
    expect(mockCoop.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      include: { project: { select: { title: true, domain: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    })
  })
})

describe('getActiveListingByProjectId', () => {
  it('finds first active listing for a project', async () => {
    mockCoop.findFirst.mockResolvedValue(null)
    await getActiveListingByProjectId('p1')
    expect(mockCoop.findFirst).toHaveBeenCalledWith({
      where: { projectId: 'p1', active: true },
    })
  })
})
