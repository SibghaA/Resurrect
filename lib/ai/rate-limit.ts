import { getUserAiUsage, incrementAiCalls } from '@/lib/db/user'
import { startOfMonth } from 'date-fns'

export const FREE_TIER_LIMIT = 20

export interface RateLimitResult {
  allowed: boolean
  usedThisMonth: number
  limit: number | null // null = unlimited (pro)
  isProTier: boolean
}

export async function checkAiRateLimit(userId: string): Promise<RateLimitResult> {
  const usage = await getUserAiUsage(userId)

  if (!usage) {
    // Fail open — unknown user, let the AI call proceed
    return { allowed: true, usedThisMonth: 0, limit: FREE_TIER_LIMIT, isProTier: false }
  }

  const isProTier = usage.tier === 'pro'

  if (isProTier) {
    return { allowed: true, usedThisMonth: usage.aiCallsThisMonth, limit: null, isProTier: true }
  }

  // Detect month rollover — if resetAt is in a prior month, effective count is 0
  const resetAt = new Date(usage.aiCallsResetAt)
  const currentMonthStart = startOfMonth(new Date())
  const effectiveCount = resetAt < currentMonthStart ? 0 : usage.aiCallsThisMonth

  const allowed = effectiveCount < FREE_TIER_LIMIT

  return {
    allowed,
    usedThisMonth: effectiveCount,
    limit: FREE_TIER_LIMIT,
    isProTier: false,
  }
}

export { incrementAiCalls }
