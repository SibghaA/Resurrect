import { prisma } from './prisma'

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
