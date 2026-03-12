import { coopListingSchema, coopListingUpdateSchema } from '@/lib/validators/coop-listing'

describe('coopListingSchema', () => {
  const valid = {
    projectId: 'proj-1',
    description: 'Need a designer',
    domainTags: ['Web'],
    skillTagsHave: ['TypeScript'],
    skillTagsNeed: ['Figma'],
    timeCommitment: '5 hrs/week',
    milestonePreview: 'Complete landing page',
    visibility: 'Open to All' as const,
  }

  it('accepts valid listing', () => {
    expect(coopListingSchema.safeParse(valid).success).toBe(true)
  })

  it('applies defaults for arrays and visibility', () => {
    const result = coopListingSchema.safeParse({
      projectId: 'proj-1',
      description: 'Need help',
      timeCommitment: '5 hrs/week',
      milestonePreview: 'MVP',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.domainTags).toEqual([])
      expect(result.data.skillTagsHave).toEqual([])
      expect(result.data.skillTagsNeed).toEqual([])
      expect(result.data.visibility).toBe('Open to All')
    }
  })

  it('rejects description longer than 280 characters', () => {
    const result = coopListingSchema.safeParse({ ...valid, description: 'x'.repeat(281) })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe('Description must be 280 characters or less')
  })

  it('rejects more than 10 domainTags', () => {
    expect(
      coopListingSchema.safeParse({ ...valid, domainTags: Array(11).fill('tag') }).success
    ).toBe(false)
  })

  it('rejects more than 20 skillTagsHave', () => {
    expect(
      coopListingSchema.safeParse({ ...valid, skillTagsHave: Array(21).fill('tag') }).success
    ).toBe(false)
  })

  it('rejects invalid visibility', () => {
    expect(coopListingSchema.safeParse({ ...valid, visibility: 'Public' }).success).toBe(false)
  })

  it('accepts all valid visibilities', () => {
    for (const visibility of ['Open to All', 'Invite-Only', 'Application Required']) {
      expect(coopListingSchema.safeParse({ ...valid, visibility }).success).toBe(true)
    }
  })
})

describe('coopListingUpdateSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(coopListingUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts valid status update', () => {
    expect(coopListingUpdateSchema.safeParse({ status: 'Filled' }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(coopListingUpdateSchema.safeParse({ status: 'Closed' }).success).toBe(false)
  })

  it('accepts partial field updates', () => {
    const result = coopListingUpdateSchema.safeParse({
      description: 'Updated description',
      skillTagsNeed: ['React'],
    })
    expect(result.success).toBe(true)
  })
})
