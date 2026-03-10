import { prisma } from './prisma'
import type { CoopListingInput, CoopListingUpdateInput } from '@/lib/validators/coop-listing'

export function createCoopListing(userId: string, data: CoopListingInput) {
  return prisma.coopListing.create({
    data: {
      userId,
      projectId: data.projectId,
      description: data.description,
      domainTags: JSON.stringify(data.domainTags),
      skillTagsHave: JSON.stringify(data.skillTagsHave),
      skillTagsNeed: JSON.stringify(data.skillTagsNeed),
      timeCommitment: data.timeCommitment,
      milestonePreview: data.milestonePreview,
      visibility: data.visibility,
    },
  })
}

export function getCoopListingById(id: string) {
  return prisma.coopListing.findUnique({
    where: { id },
    include: {
      project: { select: { title: true, domain: true, status: true } },
      user: { select: { id: true, name: true, flakeRate: true } },
    },
  })
}

export function getActiveCoopListings(filters?: { status?: string; search?: string }) {
  return prisma.coopListing.findMany({
    where: {
      active: true,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.search
        ? {
            OR: [
              { description: { contains: filters.search } },
              { project: { title: { contains: filters.search } } },
            ],
          }
        : {}),
    },
    include: {
      project: { select: { title: true, domain: true, status: true } },
      user: { select: { id: true, name: true, flakeRate: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function getCoopListingsByUserId(userId: string) {
  return prisma.coopListing.findMany({
    where: { userId },
    include: {
      project: { select: { title: true, domain: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function getActiveListingByProjectId(projectId: string) {
  return prisma.coopListing.findFirst({
    where: { projectId, active: true },
  })
}

export function updateCoopListing(id: string, data: CoopListingUpdateInput) {
  const updateData: Record<string, unknown> = {}
  if (data.description !== undefined) updateData.description = data.description
  if (data.domainTags !== undefined) updateData.domainTags = JSON.stringify(data.domainTags)
  if (data.skillTagsHave !== undefined) updateData.skillTagsHave = JSON.stringify(data.skillTagsHave)
  if (data.skillTagsNeed !== undefined) updateData.skillTagsNeed = JSON.stringify(data.skillTagsNeed)
  if (data.timeCommitment !== undefined) updateData.timeCommitment = data.timeCommitment
  if (data.milestonePreview !== undefined) updateData.milestonePreview = data.milestonePreview
  if (data.status !== undefined) updateData.status = data.status
  if (data.visibility !== undefined) updateData.visibility = data.visibility

  return prisma.coopListing.update({
    where: { id },
    data: updateData,
  })
}

export function deactivateCoopListing(id: string) {
  return prisma.coopListing.update({
    where: { id },
    data: { active: false },
  })
}

export function deleteCoopListing(id: string) {
  return prisma.coopListing.delete({
    where: { id },
  })
}
