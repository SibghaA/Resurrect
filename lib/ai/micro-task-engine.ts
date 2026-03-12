import { createHash } from 'crypto'
import { generateCompletion } from './client'
import { MICRO_TASK_SYSTEM_PROMPT, buildMicroTaskUserMessage } from './prompts'
import { aiTaskListSchema } from '@/lib/validators/micro-task'
import {
  createMicroTaskBatch,
  deleteAllMicroTasks,
  getMicroTasksByProject,
} from '@/lib/db/micro-task'
import { getCachedTasks, setCachedTasks } from '@/lib/db/ai-cache'
import { checkAiRateLimit, incrementAiCalls } from './rate-limit'
import { generateFallbackTasks } from './fallback'

interface ProjectContext {
  id: string
  title: string
  description: string
  domain: string
  contextSnapshot: string
}

export interface GenerateResult {
  batchId: string
  tasks: Awaited<ReturnType<typeof getMicroTasksByProject>>
  source: 'ai' | 'template' | 'cache'
  usedThisMonth: number
  limit: number | null
  isProTier: boolean
}

function buildCacheKey(projectId: string, milestone: string, timeAvailability?: number): string {
  const raw = `${projectId}::${milestone}::${timeAvailability ?? ''}`
  return createHash('sha256').update(raw).digest('hex')
}

export async function generateMicroTasks(
  project: ProjectContext,
  targetMilestone: string,
  timeAvailability: number | undefined,
  userId: string
): Promise<GenerateResult> {
  const cacheKey = buildCacheKey(project.id, targetMilestone, timeAvailability)

  // ── 1. Cache hit ──────────────────────────────────────────────────────────
  const cached = await getCachedTasks(project.id, cacheKey)
  if (cached) {
    const batchId = crypto.randomUUID()
    await deleteAllMicroTasks(project.id)
    await createMicroTaskBatch(project.id, batchId, cached.tasks)
    const tasks = await getMicroTasksByProject(project.id)
    const usage = await checkAiRateLimit(userId)

    return {
      batchId,
      tasks,
      source: 'cache',
      usedThisMonth: usage.usedThisMonth,
      limit: usage.limit,
      isProTier: usage.isProTier,
    }
  }

  // ── 2. Rate limit check ───────────────────────────────────────────────────
  const rateLimitResult = await checkAiRateLimit(userId)

  let aiTasks
  let source: 'ai' | 'template'

  if (!rateLimitResult.allowed) {
    // Limit reached — use template fallback
    aiTasks = generateFallbackTasks(project.domain)
    source = 'template'
  } else {
    // ── 3. AI generation ───────────────────────────────────────────────────
    try {
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
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      const parsed: unknown = JSON.parse(cleaned)
      aiTasks = aiTaskListSchema.parse(parsed)
      source = 'ai'

      // Increment usage counter only on successful AI calls
      await incrementAiCalls(userId)
    } catch {
      // AI unavailable — fall back gracefully
      aiTasks = generateFallbackTasks(project.domain)
      source = 'template'
    }
  }

  // ── 4. Persist to DB ──────────────────────────────────────────────────────
  const batchId = crypto.randomUUID()
  await deleteAllMicroTasks(project.id)
  await createMicroTaskBatch(project.id, batchId, aiTasks)

  // ── 5. Cache the result ───────────────────────────────────────────────────
  await setCachedTasks(project.id, cacheKey, aiTasks, source)

  const tasks = await getMicroTasksByProject(project.id)

  // Re-read usage after potential increment for accurate UI count
  const finalUsage = await checkAiRateLimit(userId)

  return {
    batchId,
    tasks,
    source,
    usedThisMonth: finalUsage.usedThisMonth,
    limit: finalUsage.limit,
    isProTier: finalUsage.isProTier,
  }
}
