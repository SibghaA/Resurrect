'use client'

import { useState, useEffect } from 'react'

interface MicroTaskEngineProps {
  projectId: string
}

interface MicroTask {
  id: string
  taskId: number
  title: string
  description: string
  estimatedMinutes: number
  category: string
  dependencies: string
  status: string
  order: number
}

const CATEGORY_COLORS: Record<string, string> = {
  setup: 'bg-purple-100 text-purple-800',
  code: 'bg-blue-100 text-blue-800',
  design: 'bg-pink-100 text-pink-800',
  research: 'bg-yellow-100 text-yellow-800',
  test: 'bg-green-100 text-green-800',
  docs: 'bg-gray-100 text-gray-700',
  fix: 'bg-red-100 text-red-800',
  refactor: 'bg-orange-100 text-orange-800',
}

export default function MicroTaskEngine({ projectId }: MicroTaskEngineProps) {
  const [tasks, setTasks] = useState<MicroTask[]>([])
  const [targetMilestone, setTargetMilestone] = useState('')
  const [timeAvailability, setTimeAvailability] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  async function fetchTasks() {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`)
      const data: { tasks?: MicroTask[]; error?: string } = await res.json()
      if (res.ok && data.tasks) {
        setTasks(data.tasks)
      }
    } catch {
      // silently fail on initial load
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!targetMilestone.trim()) return
    setGenerating(true)
    setError('')

    try {
      const body: Record<string, unknown> = { targetMilestone: targetMilestone.trim() }
      const mins = parseInt(timeAvailability, 10)
      if (!isNaN(mins) && mins >= 10) {
        body.timeAvailability = mins
      }

      const res = await fetch(`/api/projects/${projectId}/tasks/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data: { tasks?: MicroTask[]; error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate tasks.')
        return
      }
      if (data.tasks) {
        setTasks(data.tasks)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleUpdateStatus(taskDbId: string, status: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskDbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        if (status === 'dismissed') {
          setTasks((prev) => prev.filter((t) => t.id !== taskDbId))
        } else {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskDbId ? { ...t, status } : t))
          )
        }
      }
    } catch {
      // fail silently for status updates
    }
  }

  function startEdit(task: MicroTask) {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description)
  }

  async function saveEdit(taskDbId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskDbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      })
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskDbId ? { ...t, title: editTitle, description: editDescription } : t
          )
        )
        setEditingId(null)
      }
    } catch {
      // fail silently
    }
  }

  const acceptedCount = tasks.filter((t) => t.status === 'accepted').length

  function parseDeps(deps: string): number[] {
    try {
      const parsed: unknown = JSON.parse(deps)
      if (Array.isArray(parsed)) return parsed as number[]
    } catch {
      // ignore
    }
    return []
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Generation Form */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target milestone
          </label>
          <input
            type="text"
            value={targetMilestone}
            onChange={(e) => setTargetMilestone(e.target.value)}
            placeholder="e.g. Get the landing page deployed"
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time available (minutes, optional)
          </label>
          <input
            type="number"
            value={timeAvailability}
            onChange={(e) => setTimeAvailability(e.target.value)}
            placeholder="e.g. 60"
            min={10}
            max={480}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !targetMilestone.trim()}
          className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {generating ? 'Breaking it down...' : 'Break it down'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {/* Loading skeletons during generation */}
      {generating && (
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Task List */}
      {!generating && tasks.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              {acceptedCount} of {tasks.length} tasks accepted
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating || !targetMilestone.trim()}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Start fresh
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => {
              const deps = parseDeps(task.dependencies)
              const isEditing = editingId === task.id

              return (
                <div
                  key={task.id}
                  className={`border rounded-xl p-4 transition-colors ${
                    task.status === 'accepted'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(task.id)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {task.taskId}. {task.title}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500">
                            ~{task.estimatedMinutes}m
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              CATEGORY_COLORS[task.category] ?? 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {task.category}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>

                      {deps.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Depends on: {deps.map((d) => `#${d}`).join(', ')}
                        </p>
                      )}

                      <div className="flex gap-3 mt-3">
                        {task.status !== 'accepted' && (
                          <button
                            onClick={() => handleUpdateStatus(task.id, 'accepted')}
                            className="text-sm font-medium text-green-600 hover:text-green-800"
                          >
                            Accept
                          </button>
                        )}
                        {task.status === 'accepted' && (
                          <button
                            onClick={() => handleUpdateStatus(task.id, 'pending')}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                          >
                            Undo
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(task)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'dismissed')}
                          className="text-sm font-medium text-red-500 hover:text-red-700"
                        >
                          Dismiss
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
