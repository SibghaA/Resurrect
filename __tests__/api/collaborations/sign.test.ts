import { POST } from '@/app/api/collaborations/[id]/handshake/sign/route'
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getHandshakeByCollaborationId, signHandshake, updateHandshakePdfInfo } from '@/lib/db/handshake'
import { updateCollaborationStatus } from '@/lib/db/collaboration'
import { generateHandshakePDF, uploadToS3, computePdfHash } from '@/lib/pdf'

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/db/handshake', () => ({
  getHandshakeByCollaborationId: jest.fn(),
  signHandshake: jest.fn(),
  updateHandshakePdfInfo: jest.fn(),
}))

jest.mock('@/lib/db/collaboration', () => ({
  updateCollaborationStatus: jest.fn(),
}))

jest.mock('@/lib/pdf', () => ({
  generateHandshakePDF: jest.fn(),
  uploadToS3: jest.fn(),
  computePdfHash: jest.fn(),
}))

function createRequest(body?: any) {
  return new NextRequest('http://localhost:3000/api/collaborations/c1/handshake/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

describe('POST /api/collaborations/[id]/handshake/sign', () => {
  const mockParams = { params: { id: 'c1' } }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 if unauthorized', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await POST(createRequest({ signature: 'John' }), mockParams)
    expect(res.status).toBe(401)
  })

  it('returns 400 if signature is missing or not a string', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
    const res = await POST(createRequest({ signature: 123 }), mockParams)
    expect(res.status).toBe(400)
    
    const res2 = await POST(createRequest({}), mockParams)
    expect(res2.status).toBe(400)
  })

  it('returns 404 if handshake not found', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
    ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue(null)
    const res = await POST(createRequest({ signature: 'John' }), mockParams)
    expect(res.status).toBe(404)
  })

  it('returns 403 if user not part of collaboration', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
    ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue({
      collaboration: { initiatorId: 'user2', collaboratorId: 'user3' }
    })
    const res = await POST(createRequest({ signature: 'John' }), mockParams)
    expect(res.status).toBe(403)
  })

  it('returns 400 if user has already signed (initiator)', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
    ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue({
      collaboration: { initiatorId: 'user1', collaboratorId: 'user2' },
      initiatorSignature: 'Already signed',
    })
    const res = await POST(createRequest({ signature: 'John' }), mockParams)
    expect(res.status).toBe(400)
  })

  it('returns 400 if user has already signed (collaborator)', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user2' })
    ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue({
      collaboration: { initiatorId: 'user1', collaboratorId: 'user2' },
      collaboratorSignature: 'Already signed',
    })
    const res = await POST(createRequest({ signature: 'John' }), mockParams)
    expect(res.status).toBe(400)
  })

  it('signs and does not generate PDF if only one party signed', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user1' })
    ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue({
      id: 'h1',
      collaboration: { initiatorId: 'user1', collaboratorId: 'user2', id: 'c1' },
      initiatorSignature: null,
      collaboratorSignature: null,
    })
    ;(signHandshake as jest.Mock).mockResolvedValue({
      id: 'h1',
      initiatorSignature: 'John',
      collaboratorSignature: null,
    })

    const res = await POST(createRequest({ signature: 'John' }), mockParams)
    
    expect(res.status).toBe(200)
    expect(signHandshake).toHaveBeenCalledWith('h1', 'user1', 'John', 'initiator')
    expect(generateHandshakePDF).not.toHaveBeenCalled()
  })

  it('generates PDF, updates collab and pdf info if fully signed', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ sub: 'user2' })
    ;(getHandshakeByCollaborationId as jest.Mock).mockResolvedValue({
      id: 'h1',
      collaboration: {
        id: 'c1',
        initiatorId: 'user1',
        collaboratorId: 'user2',
        listing: { project: { title: 'Project Title' } },
      },
      initiatorSignature: 'John',
    })
    ;(signHandshake as jest.Mock).mockResolvedValue({
      id: 'h1',
      projectDescription: 'Desc',
      collaboratorRole: 'Role',
      ipClause: 'IP',
      creditAgreement: 'Credit',
      exitClause: 'Exit',
      confidentiality: 'Conf',
      milestoneSchedule: '[]',
      initiatorSignature: 'John',
      initiatorSignedAt: new Date(1),
      collaboratorSignature: 'Jane',
      collaboratorSignedAt: new Date(2),
    })

    const mockBuffer = Buffer.from('pdf')
    ;(generateHandshakePDF as jest.Mock).mockResolvedValue(mockBuffer)
    ;(computePdfHash as jest.Mock).mockReturnValue('mock-hash')
    ;(uploadToS3 as jest.Mock).mockResolvedValue('s3/path.txt')

    const res = await POST(createRequest({ signature: 'Jane' }), mockParams)

    expect(res.status).toBe(200)
    expect(generateHandshakePDF).toHaveBeenCalled()
    expect(computePdfHash).toHaveBeenCalledWith(mockBuffer)
    expect(uploadToS3).toHaveBeenCalledWith(mockBuffer, 'agreements/h1-collaborator-signed.txt')
    expect(updateHandshakePdfInfo).toHaveBeenCalledWith('h1', 's3/path.txt', 'mock-hash')
    expect(updateCollaborationStatus).toHaveBeenCalledWith('c1', { status: 'Active' })
  })
})
