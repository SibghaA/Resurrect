import { GET, PATCH } from '@/app/api/collaborations/[id]/handshake/route'
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getCollaborationById } from '@/lib/db/collaboration'
import { getHandshakeByCollaborationId, createHandshakeAgreement, updateHandshakeAgreement } from '@/lib/db/handshake'

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/db/collaboration', () => ({
  getCollaborationById: jest.fn(),
}))

jest.mock('@/lib/db/handshake', () => ({
  getHandshakeByCollaborationId: jest.fn(),
  createHandshakeAgreement: jest.fn(),
  updateHandshakeAgreement: jest.fn(),
}))

function createRequest(method: string, body?: any) {
  return new NextRequest('http://localhost:3000/api/collaborations/c1/handshake', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

describe('/api/collaborations/[id]/handshake', () => {
  const mockParams = { params: { id: 'c1' } }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      ;(getSession as jest.Mock).mockResolvedValue(null)
      const res = await GET(createRequest('GET'), mockParams)
      expect(res.status).toBe(401)
    })

    it('returns 404 if collaboration not found', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
      ;(getCollaborationById as jest.Mock).mockResolvedValue(null)
      const res = await GET(createRequest('GET'), mockParams)
      expect(res.status).toBe(404)
    })

    it('returns 403 if user not part of collaboration', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
      ;(getCollaborationById as jest.Mock).mockResolvedValue({
        id: 'c1',
        initiatorId: 'user2',
        collaboratorId: 'user3',
      })
      const res = await GET(createRequest('GET'), mockParams)
      expect(res.status).toBe(403)
    })

    it('returns existing handshake', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
      ;(getCollaborationById as jest.Mock).mockResolvedValue({
        id: 'c1',
        initiatorId: 'user1',
        collaboratorId: 'user2',
      })
      const mockHandshake = { id: 'h1', collaborationId: 'c1' }
      ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue(mockHandshake)

      const res = await GET(createRequest('GET'), mockParams)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(mockHandshake)
      expect(createHandshakeAgreement).not.toHaveBeenCalled()
    })

    it('auto-creates draft if handshake does not exist', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
      ;(getCollaborationById as jest.Mock).mockResolvedValue({
        id: 'c1',
        initiatorId: 'user1',
        collaboratorId: 'user2',
        listing: {
          description: 'A great project',
          skillTagsNeed: 'React',
        },
      })
      ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue(null)
      
      const draftHandshake = { id: 'h2', collaborationId: 'c1', projectDescription: 'A great project' }
      ;(createHandshakeAgreement as jest.Mock).mockResolvedValue(draftHandshake)

      const res = await GET(createRequest('GET'), mockParams)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(draftHandshake)
      expect(createHandshakeAgreement).toHaveBeenCalledWith({
        collaborationId: 'c1',
        projectDescription: 'A great project',
        collaboratorRole: 'React',
        ipClause: 'Equal Co-ownership',
        creditAgreement: 'Prominent mention as co-creator',
        milestoneSchedule: '[]',
      })
    })
  })

  describe('PATCH', () => {
    it('returns 401 if unauthorized', async () => {
      ;(getSession as jest.Mock).mockResolvedValue(null)
      const res = await PATCH(createRequest('PATCH', {}), mockParams)
      expect(res.status).toBe(401)
    })

    it('returns 404 if collaboration not found', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
      ;(getCollaborationById as jest.Mock).mockResolvedValue(null)
      const res = await PATCH(createRequest('PATCH', {}), mockParams)
      expect(res.status).toBe(404)
    })

    it('returns 403 if user not part of collaboration', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
      ;(getCollaborationById as jest.Mock).mockResolvedValue({
        id: 'c1',
        initiatorId: 'user2',
        collaboratorId: 'user3',
      })
      const res = await PATCH(createRequest('PATCH', {}), mockParams)
      expect(res.status).toBe(403)
    })

    it('returns 400 if handshake not initialized', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
      ;(getCollaborationById as jest.Mock).mockResolvedValue({
        id: 'c1',
        initiatorId: 'user1',
        collaboratorId: 'user2',
      })
      ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue(null)

      const res = await PATCH(createRequest('PATCH', {}), mockParams)
      expect(res.status).toBe(400)
    })

    it('returns 400 if agreement is already signed', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
      ;(getCollaborationById as jest.Mock).mockResolvedValue({
        id: 'c1',
        initiatorId: 'user1',
        collaboratorId: 'user2',
      })
      ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue({
        id: 'h1',
        initiatorSignature: 'Signed by initiator',
        collaboratorSignature: null,
      })

      const res = await PATCH(createRequest('PATCH', {}), mockParams)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('Cannot edit signed agreement')
    })

    it('updates handshake and stringifies object milestoneSchedule', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
      ;(getCollaborationById as jest.Mock).mockResolvedValue({
        id: 'c1',
        initiatorId: 'user1',
        collaboratorId: 'user2',
      })
      ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue({
        id: 'h1',
        initiatorSignature: null,
        collaboratorSignature: null,
      })

      const requestBody = {
        projectDescription: 'Desc update',
        collaboratorRole: 'Role update',
        ipClause: 'IP update',
        customIpClause: 'Custom IP',
        creditAgreement: 'Credit update',
        exitClause: 'Exit clause update',
        confidentiality: 'Conf update',
        milestoneSchedule: [{ id: 1, name: 'MS 1' }],
      }

      ;(updateHandshakeAgreement as jest.Mock).mockResolvedValue({ ...requestBody, id: 'h1' })

      const res = await PATCH(createRequest('PATCH', requestBody), mockParams)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.id).toBe('h1')
      expect(updateHandshakeAgreement).toHaveBeenCalledWith('h1', {
        ...requestBody,
        milestoneSchedule: JSON.stringify([{ id: 1, name: 'MS 1' }]),
      })
    })

    it('updates handshake with string milestoneSchedule', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
      ;(getCollaborationById as jest.Mock).mockResolvedValue({
        id: 'c1',
        initiatorId: 'user1',
        collaboratorId: 'user2',
      })
      ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue({
        id: 'h1',
        initiatorSignature: null,
        collaboratorSignature: null,
      })

      const requestBody = { milestoneSchedule: '[]' }

      ;(updateHandshakeAgreement as jest.Mock).mockResolvedValue({ id: 'h1', milestoneSchedule: '[]' })

      const res = await PATCH(createRequest('PATCH', requestBody), mockParams)
      
      expect(res.status).toBe(200)
      expect(updateHandshakeAgreement).toHaveBeenCalledWith('h1', {
        projectDescription: undefined,
        collaboratorRole: undefined,
        ipClause: undefined,
        customIpClause: undefined,
        creditAgreement: undefined,
        exitClause: undefined,
        confidentiality: undefined,
        milestoneSchedule: '[]',
      })
    })
  })
})
