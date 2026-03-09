import { z } from 'zod'

const PROJECT_STATUSES = ['Never Started', 'In Progress', 'Stalled', 'Paused'] as const

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  domain: z.string().min(1, 'Domain is required').max(100),
  effortRemaining: z.string().min(1, 'Effort remaining is required').max(200),
  status: z.enum(PROJECT_STATUSES).default('In Progress'),
})

export type ProjectInput = z.infer<typeof projectSchema>
export { PROJECT_STATUSES }
