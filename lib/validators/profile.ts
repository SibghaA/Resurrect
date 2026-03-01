import { z } from 'zod'

const optionalUrl = z.string().url('Must be a valid URL').optional().or(z.literal(''))

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(500).default(''),
  skillTags: z.array(z.string().max(30)).max(20).default([]),
  socialLinks: z
    .object({
      github: optionalUrl,
      twitter: optionalUrl,
      website: optionalUrl,
    })
    .default({}),
})

export type ProfileInput = z.infer<typeof profileSchema>
