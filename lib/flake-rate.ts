import { prisma } from './db/prisma'
import { getCollaborationsForFlakeRate, updateCollaborationStatus } from './db/collaboration'

type CollabForRate = {
  id: string
  status: string
  milestoneDeadline: Date | null
  lastCommunicationAt: Date | null
  handoffCompletedAt: Date | null
  exitTriggeredAt: Date | null
  createdAt?: Date
}

/**
 * Returns true if a collab should count as Abandoned based on the 2× overdue rule:
 * milestone deadline is set, now > deadline × 2, and there has been no communication
 * since the deadline (or ever).
 */
function isOverdueAbandoned(collab: CollabForRate, now: Date): boolean {
  if (!collab.milestoneDeadline) return false
  const deadline = new Date(collab.milestoneDeadline)
  if (now.getTime() <= deadline.getTime() * 2 - new Date(0).getTime()) return false

  // No communication after the deadline
  const lastComm = collab.lastCommunicationAt ? new Date(collab.lastCommunicationAt) : null
  if (lastComm && lastComm > deadline) return false

  return true
}

/**
 * Computes flake rate as a percentage (0–100, 1 dp) from a list of collaborations.
 * Excludes Active collaborations from the denominator — only resolved ones count.
 */
export function computeFlakeRate(collabs: CollabForRate[], now = new Date()): number {
  const resolved = collabs.filter(
    (c) => c.status === 'Completed' || c.status === 'Abandoned' || isOverdueAbandoned(c, now)
  )
  if (resolved.length === 0) return 0

  const abandoned = resolved.filter((c) => c.status === 'Abandoned' || isOverdueAbandoned(c, now))

  return Math.round((abandoned.length / resolved.length) * 1000) / 10
}

export async function recalculateFlakeRateForUser(userId: string): Promise<void> {
  const collabs = await getCollaborationsForFlakeRate(userId)
  const now = new Date()

  // Auto-mark overdue ones as Abandoned
  for (const c of collabs) {
    if (c.status === 'Active' && isOverdueAbandoned(c, now)) {
      await updateCollaborationStatus(c.id, { status: 'Abandoned' })
      c.status = 'Abandoned'
    }
  }

  const rate = computeFlakeRate(collabs, now)

  await prisma.user.update({
    where: { id: userId },
    data: { flakeRate: rate },
  })
}

export async function recalculateAllFlakeRates(): Promise<number> {
  // Fetch all user IDs in batches
  const take = 100
  let skip = 0
  let total = 0

  while (true) {
    const users = await prisma.user.findMany({
      select: { id: true },
      take,
      skip,
      orderBy: { createdAt: 'asc' },
    })
    if (users.length === 0) break

    await Promise.all(users.map((u: { id: string }) => recalculateFlakeRateForUser(u.id)))
    total += users.length
    skip += take
    if (users.length < take) break
  }

  return total
}

/**
 * Returns total number of resolved (Completed + Abandoned) collaborations for a user.
 * Used to determine "New Member" status.
 */
export async function getResolvedCollabCount(userId: string): Promise<number> {
  return prisma.collaboration.count({
    where: {
      OR: [{ initiatorId: userId }, { collaboratorId: userId }],
      status: { in: ['Completed', 'Abandoned'] },
    },
  })
}
