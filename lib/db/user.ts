import { prisma } from './prisma'
import { startOfMonth } from 'date-fns'

export interface ProfileData {
  name: string
  bio: string
  skillTags: string[]
  socialLinks: { github?: string; twitter?: string; website?: string }
}

export function createUser(email: string, passwordHash: string) {
  return prisma.user.create({ data: { email, passwordHash } })
}

export function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export function updateUserProfile(id: string, data: ProfileData) {
  const cleanSocialLinks = Object.fromEntries(
    Object.entries(data.socialLinks).filter(([, v]) => Boolean(v))
  )
  return prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      bio: data.bio,
      skillTags: JSON.stringify(data.skillTags),
      socialLinks: JSON.stringify(cleanSocialLinks),
      profileSetup: true,
    },
  })
}

export async function getUserAiUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, aiCallsThisMonth: true, aiCallsResetAt: true },
  })
  return user
}

export async function incrementAiCalls(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiCallsResetAt: true, aiCallsThisMonth: true },
  })
  if (!user) return

  const resetAt = new Date(user.aiCallsResetAt)
  const currentMonthStart = startOfMonth(new Date())

  if (resetAt < currentMonthStart) {
    // New month — reset counter before incrementing
    await prisma.user.update({
      where: { id: userId },
      data: { aiCallsThisMonth: 1, aiCallsResetAt: new Date() },
    })
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { aiCallsThisMonth: { increment: 1 } },
    })
  }
}
