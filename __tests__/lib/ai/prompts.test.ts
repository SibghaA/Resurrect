import { MICRO_TASK_SYSTEM_PROMPT, buildMicroTaskUserMessage } from '@/lib/ai/prompts'

describe('MICRO_TASK_SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof MICRO_TASK_SYSTEM_PROMPT).toBe('string')
    expect(MICRO_TASK_SYSTEM_PROMPT.length).toBeGreaterThan(0)
  })

  it('instructs the AI to return a JSON array only', () => {
    expect(MICRO_TASK_SYSTEM_PROMPT).toMatch(/JSON array/i)
  })

  it('instructs the AI not to use discouraging language in task copy', () => {
    // The prompt explicitly names "abandoned" and "failed" as words the AI must NOT use
    expect(MICRO_TASK_SYSTEM_PROMPT).toMatch(/never use words like/i)
    expect(MICRO_TASK_SYSTEM_PROMPT).toMatch(/abandoned/)
    expect(MICRO_TASK_SYSTEM_PROMPT).toMatch(/failed/)
  })
})

describe('buildMicroTaskUserMessage', () => {
  const base = {
    projectTitle: 'My App',
    projectDescription: 'A cool web app',
    projectDomain: 'Web',
    contextSnapshot: {},
    targetMilestone: 'Complete auth module',
  }

  it('includes project title, domain, description, and milestone', () => {
    const msg = buildMicroTaskUserMessage(base)
    expect(msg).toContain('My App')
    expect(msg).toContain('Web')
    expect(msg).toContain('A cool web app')
    expect(msg).toContain('Complete auth module')
  })

  it('includes currentState when provided', () => {
    const msg = buildMicroTaskUserMessage({
      ...base,
      contextSnapshot: { currentState: 'Auth half done' },
    })
    expect(msg).toContain('Auth half done')
  })

  it('includes blockers when provided', () => {
    const msg = buildMicroTaskUserMessage({
      ...base,
      contextSnapshot: { blockers: 'DB issues' },
    })
    expect(msg).toContain('DB issues')
  })

  it('includes nextSteps when provided', () => {
    const msg = buildMicroTaskUserMessage({
      ...base,
      contextSnapshot: { nextSteps: 'Deploy to prod' },
    })
    expect(msg).toContain('Deploy to prod')
  })

  it('omits context fields when not provided', () => {
    const msg = buildMicroTaskUserMessage(base)
    expect(msg).not.toContain('Current state:')
    expect(msg).not.toContain('Blockers:')
    expect(msg).not.toContain('Next steps noted:')
  })

  it('includes timeAvailability when provided', () => {
    const msg = buildMicroTaskUserMessage({ ...base, timeAvailability: 90 })
    expect(msg).toContain('90 minutes')
  })

  it('omits timeAvailability line when not provided', () => {
    const msg = buildMicroTaskUserMessage(base)
    expect(msg).not.toContain('Time available:')
  })
})
