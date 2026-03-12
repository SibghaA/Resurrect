import { projectSchema, contextSnapshotSchema, statusUpdateSchema } from '@/lib/validators/project'

describe('projectSchema', () => {
  const valid = {
    title: 'My Project',
    description: 'A great project',
    domain: 'Web',
    effortRemaining: '2 weeks',
  }

  it('accepts valid project with default status', () => {
    const result = projectSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('Active')
  })

  it('accepts explicit status', () => {
    const result = projectSchema.safeParse({ ...valid, status: 'Paused' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('Paused')
  })

  it('rejects invalid status', () => {
    expect(projectSchema.safeParse({ ...valid, status: 'Invalid' }).success).toBe(false)
  })

  it('rejects empty required fields', () => {
    expect(projectSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
    expect(projectSchema.safeParse({ ...valid, description: '' }).success).toBe(false)
    expect(projectSchema.safeParse({ ...valid, domain: '' }).success).toBe(false)
    expect(projectSchema.safeParse({ ...valid, effortRemaining: '' }).success).toBe(false)
  })

  it('rejects title longer than 200 characters', () => {
    expect(projectSchema.safeParse({ ...valid, title: 'a'.repeat(201) }).success).toBe(false)
  })
})

describe('contextSnapshotSchema', () => {
  it('accepts all optional fields', () => {
    const result = contextSnapshotSchema.safeParse({
      currentState: 'Working on auth',
      blockers: 'DB issue',
      nextSteps: 'Fix migrations',
    })
    expect(result.success).toBe(true)
  })

  it('applies empty string defaults', () => {
    const result = contextSnapshotSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currentState).toBe('')
      expect(result.data.blockers).toBe('')
      expect(result.data.nextSteps).toBe('')
    }
  })

  it('rejects fields exceeding 1000 characters', () => {
    expect(contextSnapshotSchema.safeParse({ currentState: 'x'.repeat(1001) }).success).toBe(false)
  })
})

describe('statusUpdateSchema', () => {
  it('accepts valid status', () => {
    for (const status of ['Active', 'Paused', 'Handed Off', 'Complete']) {
      expect(statusUpdateSchema.safeParse({ status }).success).toBe(true)
    }
  })

  it('accepts optional notes', () => {
    const result = statusUpdateSchema.safeParse({ status: 'Paused', notes: 'Taking a break' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.notes).toBe('Taking a break')
  })

  it('rejects invalid status', () => {
    expect(statusUpdateSchema.safeParse({ status: 'Abandoned' }).success).toBe(false)
  })

  it('rejects notes longer than 500 characters', () => {
    expect(statusUpdateSchema.safeParse({ status: 'Paused', notes: 'x'.repeat(501) }).success).toBe(false)
  })
})
