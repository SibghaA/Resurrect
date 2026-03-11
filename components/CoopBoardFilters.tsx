'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { COOP_LISTING_STATUSES } from '@/lib/validators/coop-listing'

export default function CoopBoardFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''
  const domain = searchParams.get('domain') ?? ''
  const skillNeed = searchParams.get('skillNeed') ?? ''
  const commitment = searchParams.get('commitment') ?? ''

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by keywords..."
          defaultValue={search}
          onChange={(e) => updateParam('search', e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Filter by Domain (e.g. Technology)"
          defaultValue={domain}
          onChange={(e) => updateParam('domain', e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="I Need Skill (e.g. React)"
          defaultValue={skillNeed}
          onChange={(e) => updateParam('skillNeed', e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <select
          value={commitment}
          onChange={(e) => updateParam('commitment', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white w-full sm:w-auto"
        >
          <option value="">Any Commitment</option>
          <option value="< 5 hrs/wk">&lt; 5 hrs/wk</option>
          <option value="5-10 hrs/wk">5-10 hrs/wk</option>
          <option value="10-20 hrs/wk">10-20 hrs/wk</option>
          <option value="20+ hrs/wk">20+ hrs/wk</option>
        </select>
        <select
          value={status}
          onChange={(e) => updateParam('status', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white w-full sm:w-auto"
        >
          <option value="">All Statuses</option>
          {COOP_LISTING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
