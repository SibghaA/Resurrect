'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PROJECT_STATUSES } from '@/lib/validators/project'

interface StatusManagerProps {
  projectId: string
  currentStatus: string
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  Paused: 'bg-amber-100 text-amber-800',
  'Handed Off': 'bg-blue-100 text-blue-800',
  Complete: 'bg-gray-100 text-gray-800',
}

export function statusBadgeColor(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'
}

export default function StatusManager({ projectId, currentStatus }: StatusManagerProps) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableStatuses = PROJECT_STATUSES.filter((s) => s !== currentStatus)

  async function handleStatusChange() {
    if (!selectedStatus) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, notes: notes || undefined }),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setShowModal(false)
      setNotes('')
      setSelectedStatus('')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePickBackUp() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Active' }),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusBadgeColor(currentStatus)}`}>
          {currentStatus}
        </span>

        {currentStatus === 'Paused' && (
          <button
            onClick={handlePickBackUp}
            disabled={loading}
            className="text-sm font-medium bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Pick this back up
          </button>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Change status
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select a status</option>
                  {availableStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Why are you changing the status?"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setError('') }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={loading || !selectedStatus}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
