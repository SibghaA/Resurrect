import {
  createProject,
  getProjectsByUserId,
  getProjectById,
  updateProjectStatus,
} from '@/lib/db/project'
import { createUser } from '@/lib/db/user'
import { cleanDatabase, prisma } from './helpers/db'

beforeAll(async () => {
  await cleanDatabase()
})

afterAll(async () => {
  await cleanDatabase()
  await prisma.$disconnect()
})

describe('project DB helpers', () => {
  let userId: string
  let projectId: string

  const testProjectInput = {
    title: 'Integration Test Project',
    description: 'A project created during integration tests',
    domain: 'Web Development',
    effortRemaining: '10 hours',
    status: 'Active' as const,
  }

  beforeAll(async () => {
    const user = await createUser('integration-projects@example.com', '$2a$10$hashedpassword')
    userId = user.id
  })

  describe('createProject', () => {
    it('creates a project for the given user', async () => {
      const project = await createProject(userId, testProjectInput)
      expect(project).toMatchObject({
        title: testProjectInput.title,
        description: testProjectInput.description,
        domain: testProjectInput.domain,
        effortRemaining: testProjectInput.effortRemaining,
        status: 'Active',
        userId,
      })
      expect(typeof project.id).toBe('string')
      expect(project.id.length).toBeGreaterThan(0)
      projectId = project.id
    })
  })

  describe('getProjectsByUserId', () => {
    it('returns all projects belonging to the user', async () => {
      const projects = await getProjectsByUserId(userId)
      expect(Array.isArray(projects)).toBe(true)
      expect(projects.length).toBeGreaterThanOrEqual(1)
      const found = projects.find((p) => p.id === projectId)
      expect(found).toBeDefined()
      expect(found?.userId).toBe(userId)
    })

    it('returns an empty array for a user with no projects', async () => {
      const otherUser = await createUser(
        'integration-projects-empty@example.com',
        '$2a$10$hashedpassword'
      )
      const projects = await getProjectsByUserId(otherUser.id)
      expect(projects).toEqual([])
    })
  })

  describe('getProjectById', () => {
    it('returns the project when the correct owner userId is provided', async () => {
      const project = await getProjectById(projectId, userId)
      expect(project).not.toBeNull()
      expect(project?.id).toBe(projectId)
      expect(project?.userId).toBe(userId)
    })

    it('returns null when a wrong userId is provided (ownership check)', async () => {
      const wrongUser = await createUser(
        'integration-projects-wrong@example.com',
        '$2a$10$hashedpassword'
      )
      const project = await getProjectById(projectId, wrongUser.id)
      expect(project).toBeNull()
    })

    it('returns null for a non-existent project id', async () => {
      const project = await getProjectById('nonexistent-project-id', userId)
      expect(project).toBeNull()
    })
  })

  describe('updateProjectStatus', () => {
    it('updates the project status and creates a status log entry', async () => {
      const [updatedProject, statusLog] = await updateProjectStatus(
        projectId,
        'Active',
        'Paused',
        'Taking a break'
      )
      expect(updatedProject.status).toBe('Paused')
      expect(updatedProject.id).toBe(projectId)
      expect(statusLog.fromStatus).toBe('Active')
      expect(statusLog.toStatus).toBe('Paused')
      expect(statusLog.notes).toBe('Taking a break')
      expect(statusLog.projectId).toBe(projectId)
    })

    it('reflects the new status in subsequent queries', async () => {
      const projects = await getProjectsByUserId(userId)
      const project = projects.find((p) => p.id === projectId)
      expect(project?.status).toBe('Paused')
    })
  })
})
