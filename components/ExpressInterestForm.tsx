'use client'

import { useState } from 'react'

interface ExpressInterestFormProps {
  listingId: string
  requiresApplication: boolean
}

export default function ExpressInterestForm({ listingId, requiresApplication }: ExpressInterestFormProps) {
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/collaborations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          applicationNote: requiresApplication ? note : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to express interest')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mt-6">
        <h3 className="text-green-900 font-medium">Interest Expressed!</h3>
        <p className="text-green-800 text-sm mt-1">The project owner has been notified.</p>
      </div>
    )
  }

  if (!showForm && requiresApplication) {
    return (
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Apply to Collaborate
        </button>
      </div>
    )
  }

  if (!requiresApplication) {
    return (
      <div className="mt-6 text-center">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Express Interest'}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
      <h3 className="text-gray-900 font-medium mb-2">Application Note</h3>
      <p className="text-gray-500 text-sm mb-4">
        This listing requires an application. Briefly explain why you're a good fit.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          required
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="I have 3 years of experience in React and love building..."
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 min-h-[100px]"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !note.trim()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  )
}
