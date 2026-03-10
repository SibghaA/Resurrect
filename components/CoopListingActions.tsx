'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CoopListingActionsProps {
  listingId: string
}

export default function CoopListingActions({ listingId }: CoopListingActionsProps) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState<'deactivate' | 'delete' | null>(null)
  const [error, setError] = useState('')

  async function handleDeactivate() {
    setLoading('deactivate')
    setError('')
    try {
      const res = await fetch(`/api/coop-listings/${listingId}/deactivate`, { method: 'PATCH' })
      if (!res.ok) {
        const data: unknown = await res.json()
        const msg = data && typeof data === 'object' && 'error' in data
          ? String((data as { error: unknown }).error)
          : 'Failed to deactivate'
        setError(msg)
        return
      }
      router.push('/coop')
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    setLoading('delete')
    setError('')
    try {
      const res = await fetch(`/api/coop-listings/${listingId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data: unknown = await res.json()
        const msg = data && typeof data === 'object' && 'error' in data
          ? String((data as { error: unknown }).error)
          : 'Failed to delete'
        setError(msg)
        return
      }
      router.push('/coop')
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <Link
        href={`/coop/${listingId}/edit`}
        className="block w-full text-center border border-indigo-600 text-indigo-600 py-2 px-4 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-sm"
      >
        Edit Listing
      </Link>

      <button
        onClick={handleDeactivate}
        disabled={loading !== null}
        className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
      >
        {loading === 'deactivate' ? 'Deactivating...' : 'Deactivate Listing'}
      </button>

      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={loading !== null}
          className="w-full border border-red-300 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
        >
          Delete Listing
        </button>
      ) : (
        <div className="border border-red-200 rounded-lg p-3 bg-red-50">
          <p className="text-sm text-red-700 mb-3">This will permanently remove the listing. Are you sure?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={loading !== null}
              className="flex-1 bg-red-600 text-white py-1.5 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading === 'delete' ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-1.5 px-3 rounded-lg text-sm font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
