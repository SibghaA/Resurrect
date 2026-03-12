'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TagInput from '@/components/TagInput'
import { COOP_LISTING_VISIBILITIES } from '@/lib/validators/coop-listing'

interface Project {
  id: string
  title: string
  description: string
}

interface CoopListingFormProps {
  projects: Project[]
  listingId?: string
  initialValues?: {
    projectId: string
    description: string
    domainTags: string[]
    skillTagsHave: string[]
    skillTagsNeed: string[]
    timeCommitment: string
    milestonePreview: string
    visibility: string
  }
}

export default function CoopListingForm({
  projects,
  listingId,
  initialValues,
}: CoopListingFormProps) {
  const router = useRouter()
  const isEdit = Boolean(listingId)

  const [projectId, setProjectId] = useState(initialValues?.projectId ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [domainTags, setDomainTags] = useState<string[]>(initialValues?.domainTags ?? [])
  const [skillTagsHave, setSkillTagsHave] = useState<string[]>(initialValues?.skillTagsHave ?? [])
  const [skillTagsNeed, setSkillTagsNeed] = useState<string[]>(initialValues?.skillTagsNeed ?? [])
  const [timeCommitment, setTimeCommitment] = useState(initialValues?.timeCommitment ?? '')
  const [milestonePreview, setMilestonePreview] = useState(initialValues?.milestonePreview ?? '')
  const [visibility, setVisibility] = useState(initialValues?.visibility ?? 'Open to All')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleProjectChange(id: string) {
    setProjectId(id)
    if (!isEdit && id) {
      const project = projects.find((p) => p.id === id)
      if (project) {
        setDescription(project.description.slice(0, 280))
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        projectId,
        description,
        domainTags,
        skillTagsHave,
        skillTagsNeed,
        timeCommitment,
        milestonePreview,
        visibility,
      }

      const res = await fetch(isEdit ? `/api/coop-listings/${listingId}` : '/api/coop-listings', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data: unknown = await res.json()

      if (!res.ok) {
        const msg =
          data && typeof data === 'object' && 'error' in data
            ? String((data as { error: unknown }).error)
            : 'Something went wrong'
        setError(msg)
        return
      }

      if (isEdit) {
        router.push(`/coop/${listingId}`)
      } else {
        const id =
          data && typeof data === 'object' && 'id' in data
            ? String((data as { id: unknown }).id)
            : ''
        router.push(`/coop/${id}`)
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            <option value="">Select a project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <span
            className={`text-xs ${description.length > 260 ? 'text-amber-600' : 'text-gray-400'}`}
          >
            {description.length}/280
          </span>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 280))}
          required
          rows={3}
          placeholder="Describe what your project needs and what you bring to the table..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Domain Tags</label>
        <TagInput
          tags={domainTags}
          onChange={setDomainTags}
          placeholder="e.g. web, mobile, data..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          I Have <span className="font-normal text-green-700">(skills you bring)</span>
        </label>
        <TagInput
          tags={skillTagsHave}
          onChange={setSkillTagsHave}
          placeholder="e.g. react, design..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          I Need{' '}
          <span className="font-normal text-amber-700">(skills you&apos;re looking for)</span>
        </label>
        <TagInput
          tags={skillTagsNeed}
          onChange={setSkillTagsNeed}
          placeholder="e.g. backend, marketing..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Time Commitment</label>
        <input
          type="text"
          value={timeCommitment}
          onChange={(e) => setTimeCommitment(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. 5–10 hrs/week, flexible"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Preview</label>
        <textarea
          value={milestonePreview}
          onChange={(e) => setMilestonePreview(e.target.value)}
          required
          rows={2}
          maxLength={500}
          placeholder="What's the first milestone a collaborator would work on?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          {COOP_LISTING_VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Post Listing'}
      </button>
    </form>
  )
}
