import {
  microTaskGenerateSchema,
  aiTaskSchema,
  aiTaskListSchema,
  microTaskUpdateSchema,
} from '@/lib/validators/micro-task'

describe('microTaskGenerateSchema', () => {
  it('accepts valid input', () => {
    const result = microTaskGenerateSchema.safeParse({
      targetMilestone: 'Complete auth module',
      timeAvailability: 60,
    })
    expect(result.success).toBe(true)
  })

  it('accepts without optional timeAvailability', () => {
    expect(microTaskGenerateSchema.safeParse({ targetMilestone: 'Auth' }).success).toBe(true)
  })

  it('rejects empty targetMilestone', () => {
    expect(microTaskGenerateSchema.safeParse({ targetMilestone: '' }).success).toBe(false)
  })

  it('rejects timeAvailability below 10', () => {
    expect(
      microTaskGenerateSchema.safeParse({ targetMilestone: 'Auth', timeAvailability: 9 }).success
    ).toBe(false)
  })

  it('rejects timeAvailability above 480', () => {
    expect(
      microTaskGenerateSchema.safeParse({ targetMilestone: 'Auth', timeAvailability: 481 }).success
    ).toBe(false)
  })
})

describe('aiTaskSchema', () => {
  const validTask = {
    task_id: 1,
    title: 'Set up database',
    description: 'Create initial schema and migrations',
    estimated_minutes: 10,
    category: 'setup',
    dependencies: [],
  }

  it('accepts valid task', () => {
    expect(aiTaskSchema.safeParse(validTask).success).toBe(true)
  })

  it('rejects estimated_minutes above 60', () => {
    expect(aiTaskSchema.safeParse({ ...validTask, estimated_minutes: 61 }).success).toBe(false)
  })

  it('rejects estimated_minutes below 1', () => {
    expect(aiTaskSchema.safeParse({ ...validTask, estimated_minutes: 0 }).success).toBe(false)
  })

  it('rejects task_id below 1', () => {
    expect(aiTaskSchema.safeParse({ ...validTask, task_id: 0 }).success).toBe(false)
  })

  it('accepts dependencies array', () => {
    const result = aiTaskSchema.safeParse({ ...validTask, task_id: 2, dependencies: [1] })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.dependencies).toEqual([1])
  })
})

describe('aiTaskListSchema', () => {
  const task = {
    task_id: 1,
    title: 'Task',
    description: 'Do something',
    estimated_minutes: 10,
    category: 'code',
    dependencies: [],
  }

  it('accepts a list of valid tasks', () => {
    expect(aiTaskListSchema.safeParse([task]).success).toBe(true)
  })

  it('rejects empty array', () => {
    expect(aiTaskListSchema.safeParse([]).success).toBe(false)
  })

  it('rejects more than 30 tasks', () => {
    expect(aiTaskListSchema.safeParse(Array(31).fill(task)).success).toBe(false)
  })
})

describe('microTaskUpdateSchema', () => {
  it('accepts valid status update', () => {
    expect(microTaskUpdateSchema.safeParse({ status: 'accepted' }).success).toBe(true)
  })

  it('accepts title update', () => {
    expect(microTaskUpdateSchema.safeParse({ title: 'New title' }).success).toBe(true)
  })

  it('accepts description update', () => {
    expect(microTaskUpdateSchema.safeParse({ description: 'New description' }).success).toBe(true)
  })

  it('accepts multiple fields at once', () => {
    expect(microTaskUpdateSchema.safeParse({ status: 'dismissed', title: 'X' }).success).toBe(true)
  })

  it('rejects invalid status value', () => {
    expect(microTaskUpdateSchema.safeParse({ status: 'completed' }).success).toBe(false)
  })

  it('rejects when no fields provided', () => {
    expect(microTaskUpdateSchema.safeParse({}).success).toBe(false)
  })
})
