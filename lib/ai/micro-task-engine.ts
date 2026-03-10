import { generateCompletion } from './client'
import { MICRO_TASK_SYSTEM_PROMPT, buildMicroTaskUserMessage } from './prompts'
import { aiTaskListSchema } from '@/lib/validators/micro-task'
import { createMicroTaskBatch, deleteAllMicroTasks } from '@/lib/db/micro-task'

interface ProjectContext {
  id: string
  title: string
  description: string
  domain: string
  contextSnapshot: string
}

export async function generateMicroTasks(
  project: ProjectContext,
  targetMilestone: string,
  timeAvailability?: number
) {
  let snapshot: { currentState?: string; blockers?: string; nextSteps?: string } = {}
  try {
    const parsed: unknown = JSON.parse(project.contextSnapshot)
    if (parsed && typeof parsed === 'object') {
      snapshot = parsed as typeof snapshot
    }
  } catch {
    // use empty snapshot
  }

  const userMessage = buildMicroTaskUserMessage({
    projectTitle: project.title,
    projectDescription: project.description,
    projectDomain: project.domain,
    contextSnapshot: snapshot,
    targetMilestone,
    timeAvailability,
  })

  const raw = await generateCompletion(MICRO_TASK_SYSTEM_PROMPT, userMessage)

  // Strip markdown fences if present
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed: unknown = JSON.parse(cleaned)
  const tasks = aiTaskListSchema.parse(parsed)

  // Clear old tasks and persist new batch
  const batchId = crypto.randomUUID()
  await deleteAllMicroTasks(project.id)
  await createMicroTaskBatch(project.id, batchId, tasks)

  return { batchId, tasks }
}
