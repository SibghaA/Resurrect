'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TagInput from './TagInput'

interface SocialLinks {
  github?: string
  twitter?: string
  website?: string
}

interface ProfileFormProps {
  initialData?: {
    name: string
    bio: string
    skillTags: string[]
    socialLinks: SocialLinks
  }
  isSetup?: boolean
}

export default function ProfileForm({ initialData, isSetup = false }: ProfileFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialData?.name ?? '')
  const [bio, setBio] = useState(initialData?.bio ?? '')
  const [skillTags, setSkillTags] = useState<string[]>(initialData?.skillTags ?? [])
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(initialData?.socialLinks ?? {})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, skillTags, socialLinks }),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          placeholder="Tell us about yourself..."
        />
        <p className="text-xs text-gray-400 mt-1">{bio.length}/500</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
        <TagInput
          tags={skillTags}
          onChange={setSkillTags}
          placeholder="Type a skill and press Enter..."
        />
        <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add. Up to 20 skills.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Social links <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="space-y-3">
          {(
            [
              { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
              { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/username' },
              { key: 'website', label: 'Website', placeholder: 'https://yoursite.com' },
            ] as const
          ).map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-16 shrink-0">{label}</span>
              <input
                type="url"
                value={socialLinks[key] ?? ''}
                onChange={(e) => setSocialLinks((s) => ({ ...s, [key]: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Saving...' : isSetup ? 'Complete setup' : 'Save changes'}
      </button>
    </form>
  )
}
