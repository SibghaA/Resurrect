jest.mock('@/lib/ai/client')
jest.mock('@/lib/db/micro-task')

import { generateCompletion } from '@/lib/ai/client'
import { deleteAllMicroTasks, createMicroTaskBatch, getMicroTasksByProject } from '@/lib/db/micro-task'
import { generateMicroTasks } from '@/lib/ai/micro-task-engine'

const mockGenerateCompletion = generateCompletion as jest.MockedFunction<typeof generateCompletion>
const mockDeleteAll = deleteAllMicroTasks as jest.MockedFunction<typeof deleteAllMicroTasks>
const mockCreateBatch = createMicroTaskBatch as jest.MockedFunction<typeof createMicroTaskBatch>

const project = {
  id: 'p1',
  title: 'My App',
  description: 'A cool app',
  domain: 'Web',
  contextSnapshot: '{"currentState":"halfway","blockers":"none","nextSteps":"deploy"}',
}

const validTasksJson = JSON.stringify([
  {
    task_id: 1,
    title: 'Set up DB',
    description: 'Create the initial schema',
    estimated_minutes: 10,
    category: 'setup',
    dependencies: [],
  },
])

beforeEach(() => {
  mockDeleteAll.mockResolvedValue({ count: 0 })
  mockCreateBatch.mockResolvedValue({ count: 1 })
})

describe('generateMicroTasks', () => {
  it('calls generateCompletion, clears old tasks, and creates batch', async () => {
    mockGenerateCompletion.mockResolvedValue(validTasksJson)
    const result = await generateMicroTasks(project, 'Deploy MVP', 60)
    expect(mockDeleteAll).toHaveBeenCalledWith('p1')
    expect(mockCreateBatch).toHaveBeenCalledWith('p1', expect.any(String), expect.arrayContaining([
      expect.objectContaining({ task_id: 1, title: 'Set up DB' }),
    ]))
    expect(result.batchId).toBeTruthy()
    expect(result.tasks).toHaveLength(1)
  })

  it('strips markdown code fences from AI response', async () => {
    mockGenerateCompletion.mockResolvedValue('```json\n' + validTasksJson + '\n```')
    const result = await generateMicroTasks(project, 'Auth', undefined)
    expect(result.tasks).toHaveLength(1)
  })

  it('handles empty contextSnapshot gracefully', async () => {
    mockGenerateCompletion.mockResolvedValue(validTasksJson)
    const emptyProject = { ...project, contextSnapshot: '{}' }
    await expect(generateMicroTasks(emptyProject, 'Milestone')).resolves.not.toThrow()
  })

  it('handles malformed contextSnapshot JSON gracefully', async () => {
    mockGenerateCompletion.mockResolvedValue(validTasksJson)
    const badProject = { ...project, contextSnapshot: 'not-json' }
    await expect(generateMicroTasks(badProject, 'Milestone')).resolves.not.toThrow()
  })

  it('handles contextSnapshot that parses to a non-object (e.g. null)', async () => {
    mockGenerateCompletion.mockResolvedValue(validTasksJson)
    const nullProject = { ...project, contextSnapshot: 'null' }
    await expect(generateMicroTasks(nullProject, 'Milestone')).resolves.not.toThrow()
  })

  it('throws when AI returns invalid JSON', async () => {
    mockGenerateCompletion.mockResolvedValue('not valid json at all')
    await expect(generateMicroTasks(project, 'Milestone')).rejects.toThrow()
  })

  it('throws when AI returns invalid task schema', async () => {
    const badTasks = JSON.stringify([{ task_id: 1, title: 'Missing fields' }])
    mockGenerateCompletion.mockResolvedValue(badTasks)
    await expect(generateMicroTasks(project, 'Milestone')).rejects.toThrow()
  })
})
