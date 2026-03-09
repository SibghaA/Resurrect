import { z } from 'zod'

const PROJECT_STATUSES = ['Active', 'Paused', 'Handed Off', 'Complete'] as const

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  domain: z.string().min(1, 'Domain is required').max(100),
  effortRemaining: z.string().min(1, 'Effort remaining is required').max(200),
  status: z.enum(PROJECT_STATUSES).default('Active'),
})

export const contextSnapshotSchema = z.object({
  currentState: z.string().max(1000).optional().default(''),
  blockers: z.string().max(1000).optional().default(''),
  nextSteps: z.string().max(1000).optional().default(''),
})

export const statusUpdateSchema = z.object({
  status: z.enum(PROJECT_STATUSES),
  notes: z.string().max(500).optional(),
})

export type ProjectInput = z.infer<typeof projectSchema>
export type ContextSnapshotInput = z.infer<typeof contextSnapshotSchema>
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>
export { PROJECT_STATUSES }
