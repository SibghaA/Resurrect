import { profileSchema } from '@/lib/validators/profile'

describe('profileSchema', () => {
  const valid = {
    name: 'Alice',
    bio: 'Developer',
    skillTags: ['TypeScript', 'React'],
    socialLinks: { github: 'https://github.com/alice' },
  }

  it('accepts valid profile', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true)
  })

  it('applies defaults for missing optional fields', () => {
    const result = profileSchema.safeParse({ name: 'Bob' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.bio).toBe('')
      expect(result.data.skillTags).toEqual([])
      expect(result.data.socialLinks).toEqual({})
    }
  })

  it('rejects empty name', () => {
    const result = profileSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe('Name is required')
  })

  it('rejects name longer than 100 characters', () => {
    const result = profileSchema.safeParse({ ...valid, name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects more than 20 skill tags', () => {
    const result = profileSchema.safeParse({ ...valid, skillTags: Array(21).fill('tag') })
    expect(result.success).toBe(false)
  })

  it('rejects invalid URL in socialLinks', () => {
    const result = profileSchema.safeParse({ ...valid, socialLinks: { github: 'not-a-url' } })
    expect(result.success).toBe(false)
  })

  it('accepts empty string for optional social link URL', () => {
    const result = profileSchema.safeParse({ ...valid, socialLinks: { github: '' } })
    expect(result.success).toBe(true)
  })

  it('rejects bio longer than 500 characters', () => {
    const result = profileSchema.safeParse({ ...valid, bio: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })
})
