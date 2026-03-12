import { z } from 'zod'

export const microTaskGenerateSchema = z.object({
  targetMilestone: z.string().min(1, 'Target milestone is required').max(500),
  timeAvailability: z.number().int().min(10).max(480).optional(),
})

export type MicroTaskGenerateInput = z.infer<typeof microTaskGenerateSchema>

export const aiTaskSchema = z.object({
  task_id: z.number().int().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  estimated_minutes: z.number().int().min(1).max(60),
  category: z.string().min(1).max(50),
  dependencies: z.array(z.number().int().min(1)),
})

export type AITask = z.infer<typeof aiTaskSchema>

export const aiTaskListSchema = z.array(aiTaskSchema).min(1).max(30)

export const microTaskUpdateSchema = z
  .object({
    status: z.enum(['pending', 'accepted', 'dismissed']).optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(1000).optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined || data.title !== undefined || data.description !== undefined,
    { message: 'At least one field must be provided' }
  )

export type MicroTaskUpdateInput = z.infer<typeof microTaskUpdateSchema>
