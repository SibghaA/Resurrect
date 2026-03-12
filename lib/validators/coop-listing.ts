import { z } from 'zod'

export const COOP_LISTING_STATUSES = ['Open', 'In Discussion', 'Filled', 'Complete'] as const
export const COOP_LISTING_VISIBILITIES = [
  'Open to All',
  'Invite-Only',
  'Application Required',
] as const

export const coopListingSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(280, 'Description must be 280 characters or less'),
  domainTags: z.array(z.string().min(1).max(50)).max(10).default([]),
  skillTagsHave: z.array(z.string().min(1).max(50)).max(20).default([]),
  skillTagsNeed: z.array(z.string().min(1).max(50)).max(20).default([]),
  timeCommitment: z.string().min(1, 'Time commitment is required').max(100),
  milestonePreview: z.string().min(1, 'Milestone preview is required').max(500),
  visibility: z.enum(COOP_LISTING_VISIBILITIES).default('Open to All'),
})

export const coopListingUpdateSchema = z.object({
  description: z.string().min(1).max(280).optional(),
  domainTags: z.array(z.string().min(1).max(50)).max(10).optional(),
  skillTagsHave: z.array(z.string().min(1).max(50)).max(20).optional(),
  skillTagsNeed: z.array(z.string().min(1).max(50)).max(20).optional(),
  timeCommitment: z.string().min(1).max(100).optional(),
  milestonePreview: z.string().min(1).max(500).optional(),
  status: z.enum(COOP_LISTING_STATUSES).optional(),
  visibility: z.enum(COOP_LISTING_VISIBILITIES).optional(),
})

export type CoopListingInput = z.infer<typeof coopListingSchema>
export type CoopListingUpdateInput = z.infer<typeof coopListingUpdateSchema>
