import { PrismaClient } from '@prisma/client'

// Use a separate test database URL if provided, otherwise fall back to DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL,
    },
  },
})

export async function cleanDatabase() {
  // Delete in reverse dependency order
  await prisma.collaborationFlag.deleteMany()
  await prisma.handshakeAgreement.deleteMany()
  await prisma.collaboration.deleteMany()
  await prisma.microTask.deleteMany()
  await prisma.statusLog.deleteMany()
  await prisma.aiTaskCache.deleteMany()
  await prisma.coopListing.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
}

export { prisma }
