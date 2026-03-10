export const MICRO_TASK_SYSTEM_PROMPT = `You are a project decomposition expert. Your job is to break down a stalled project milestone into small, actionable micro-tasks that each take roughly 10 minutes to complete.

Rules:
- Return ONLY a JSON array of task objects — no markdown, no explanation, no wrapping
- Each task object must have exactly these fields:
  - task_id: sequential integer starting at 1
  - title: short action-oriented title (imperative mood, e.g. "Set up database schema")
  - description: 1-3 sentence explanation of what to do and why
  - estimated_minutes: integer between 1 and 60 (aim for ~10 minutes each)
  - category: one of "setup", "code", "design", "research", "test", "docs", "fix", "refactor"
  - dependencies: array of task_id integers this task depends on (empty array if none)
- Generate between 3 and 20 tasks depending on milestone complexity
- Order tasks logically — earlier tasks should be done first
- Keep descriptions encouraging and concrete — never use words like "abandoned" or "failed"
- Each task should be completable in a single sitting`

interface MicroTaskPromptContext {
  projectTitle: string
  projectDescription: string
  projectDomain: string
  contextSnapshot: {
    currentState?: string
    blockers?: string
    nextSteps?: string
  }
  targetMilestone: string
  timeAvailability?: number
}

export function buildMicroTaskUserMessage(ctx: MicroTaskPromptContext): string {
  const parts = [
    `Project: ${ctx.projectTitle}`,
    `Domain: ${ctx.projectDomain}`,
    `Description: ${ctx.projectDescription}`,
  ]

  if (ctx.contextSnapshot.currentState) {
    parts.push(`Current state: ${ctx.contextSnapshot.currentState}`)
  }
  if (ctx.contextSnapshot.blockers) {
    parts.push(`Blockers: ${ctx.contextSnapshot.blockers}`)
  }
  if (ctx.contextSnapshot.nextSteps) {
    parts.push(`Next steps noted: ${ctx.contextSnapshot.nextSteps}`)
  }

  parts.push(`\nTarget milestone to break down: ${ctx.targetMilestone}`)

  if (ctx.timeAvailability) {
    parts.push(`Time available: ${ctx.timeAvailability} minutes — fit tasks within this budget`)
  }

  parts.push('\nGenerate the micro-tasks as a JSON array:')

  return parts.join('\n')
}
