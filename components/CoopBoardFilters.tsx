'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { COOP_LISTING_STATUSES } from '@/lib/validators/coop-listing'

export default function CoopBoardFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/coop?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        placeholder="Search listings..."
        defaultValue={search}
        onChange={(e) => updateParam('search', e.target.value)}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <select
        value={status}
        onChange={(e) => updateParam('status', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
      >
        <option value="">All statuses</option>
        {COOP_LISTING_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  )
}
