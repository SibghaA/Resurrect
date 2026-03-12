import { computeFlakeRate, recalculateFlakeRateForUser, recalculateAllFlakeRates, getResolvedCollabCount } from '@/lib/flake-rate'
import { prisma } from '@/lib/db/prisma'
import { getCollaborationsForFlakeRate, updateCollaborationStatus } from '@/lib/db/collaboration'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
    collaboration: {
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/db/collaboration', () => ({
  getCollaborationsForFlakeRate: jest.fn(),
  updateCollaborationStatus: jest.fn(),
}))

const mockNow = new Date('2026-03-01T00:00:00.000Z')

describe('flake-rate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(mockNow)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('computeFlakeRate', () => {
    it('returns 0 for empty collabs', () => {
      expect(computeFlakeRate([])).toBe(0)
    })

    it('returns 0 for only active collabs not overdue', () => {
      expect(computeFlakeRate([{ id: '1', status: 'Active', milestoneDeadline: null, lastCommunicationAt: null, handoffCompletedAt: null, exitTriggeredAt: null }])).toBe(0)
    })

    it('calculates flake rate for resolved collabs', () => {
      const collabs = [
        { id: '1', status: 'Completed', milestoneDeadline: null, lastCommunicationAt: null, handoffCompletedAt: null, exitTriggeredAt: null },
        { id: '2', status: 'Abandoned', milestoneDeadline: null, lastCommunicationAt: null, handoffCompletedAt: null, exitTriggeredAt: null },
      ]
      // 1 abandoned out of 2 resolved = 50%
      expect(computeFlakeRate(collabs)).toBe(50)
    })

    it('identifies overdue abandoned collabs', () => {
      const deadline = new Date(mockNow.getTime() - 1000) // 1 second ago
      const wayPastDeadline = new Date(mockNow.getTime() - 10000000) // Much older
      
      const collabs = [
        // Not overdue yet (now <= deadline * 2)
        { 
          id: '1', 
          status: 'Active', 
          milestoneDeadline: deadline, 
          lastCommunicationAt: null, 
          handoffCompletedAt: null, 
          exitTriggeredAt: null 
        },
      ]
      
      // We need to carefully mock the overdue calculation:
      // if (now.getTime() <= deadline.getTime() * 2 - new Date(0).getTime()) return false
      // This logic checks if the time elapsed since deadline is > deadline - epoch.
      const epochTime = new Date(0).getTime()
      const deadlineTime = epochTime + 10000 // deadline 10s after epoch
      const overdueTime = deadlineTime + 10001 // 10.001s after deadline
      
      const collabOverdue = {
        id: '2',
        status: 'Active',
        milestoneDeadline: new Date(deadlineTime),
        lastCommunicationAt: null,
        handoffCompletedAt: null,
        exitTriggeredAt: null
      }
      expect(computeFlakeRate([collabOverdue], new Date(overdueTime))).toBe(100)
      
      const collabOverdueButCommunicated = {
        id: '3',
        status: 'Active',
        milestoneDeadline: new Date(deadlineTime),
        lastCommunicationAt: new Date(overdueTime),
        handoffCompletedAt: null,
        exitTriggeredAt: null
      }
      expect(computeFlakeRate([collabOverdueButCommunicated], new Date(overdueTime))).toBe(0)
    })
  })

  describe('recalculateFlakeRateForUser', () => {
    it('recalculates and updates user flake rate', async () => {
      ;(getCollaborationsForFlakeRate as jest.Mock).mockResolvedValue([
        { id: '1', status: 'Completed', milestoneDeadline: null, lastCommunicationAt: null, handoffCompletedAt: null, exitTriggeredAt: null },
      ])
      
      await recalculateFlakeRateForUser('user1')
      
      expect(getCollaborationsForFlakeRate).toHaveBeenCalledWith('user1')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { flakeRate: 0 },
      })
    })

    it('auto-marks overdue active collabs as abandoned', async () => {
      const epochTime = new Date(0).getTime()
      const deadlineTime = epochTime + 10000
      const overdueTime = deadlineTime + 10001
      jest.setSystemTime(new Date(overdueTime))

      const c = { id: '1', status: 'Active', milestoneDeadline: new Date(deadlineTime), lastCommunicationAt: null, handoffCompletedAt: null, exitTriggeredAt: null }
      ;(getCollaborationsForFlakeRate as jest.Mock).mockResolvedValue([c])
      
      await recalculateFlakeRateForUser('user1')
      
      expect(updateCollaborationStatus).toHaveBeenCalledWith('1', { status: 'Abandoned' })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { flakeRate: 100 },
      })
    })
  })

  describe('recalculateAllFlakeRates', () => {
    it('processes users in batches', async () => {
      ;(prisma.user.findMany as jest.Mock)
        .mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => ({ id: `user${i}` })))
        .mockResolvedValueOnce([{ id: 'user100' }])
      
      ;(getCollaborationsForFlakeRate as jest.Mock).mockResolvedValue([])

      const total = await recalculateAllFlakeRates()
      expect(total).toBe(101)
      expect(prisma.user.findMany).toHaveBeenCalledTimes(2)
      expect(getCollaborationsForFlakeRate).toHaveBeenCalledTimes(101)
    })
    
    it('handles empty users', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      const total = await recalculateAllFlakeRates()
      expect(total).toBe(0)
    })
  })

  describe('getResolvedCollabCount', () => {
    it('calls prisma.collaboration.count with correct params', async () => {
      ;(prisma.collaboration.count as jest.Mock).mockResolvedValue(5)
      const count = await getResolvedCollabCount('user1')
      expect(count).toBe(5)
      expect(prisma.collaboration.count).toHaveBeenCalledWith({
        where: {
          OR: [{ initiatorId: 'user1' }, { collaboratorId: 'user1' }],
          status: { in: ['Completed', 'Abandoned'] },
        },
      })
    })
  })
})
