'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ContextSnapshotProps {
  projectId: string
  initialSnapshot: {
    currentState: string
    blockers: string
    nextSteps: string
  }
}

export default function ContextSnapshot({ projectId, initialSnapshot }: ContextSnapshotProps) {
  const router = useRouter()
  const [currentState, setCurrentState] = useState(initialSnapshot.currentState)
  const [blockers, setBlockers] = useState(initialSnapshot.blockers)
  const [nextSteps, setNextSteps] = useState(initialSnapshot.nextSteps)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch(`/api/projects/${projectId}/context`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentState, blockers, nextSteps }),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Where I left off
        </label>
        <textarea
          value={currentState}
          onChange={(e) => setCurrentState(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="What were you working on last?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Blockers
        </label>
        <textarea
          value={blockers}
          onChange={(e) => setBlockers(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="What's in the way?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Next steps
        </label>
        <textarea
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="What should you do when you come back?"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save snapshot'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved</span>}
      </div>
    </div>
  )
}
