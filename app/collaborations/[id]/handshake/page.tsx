'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

type HandshakeData = {
  id: string
  projectDescription: string
  collaboratorRole: string
  ipClause: string
  customIpClause: string | null
  creditAgreement: string
  exitClause: string
  confidentiality: string
  milestoneSchedule: string
  initiatorSignature: string | null
  initiatorSignedAt: string | null
  collaboratorSignature: string | null
  collaboratorSignedAt: string | null
  pdfS3Key: string | null
  collaboration: {
    initiatorId: string
    collaboratorId: string
    initiator: { name: string | null; email: string }
    collaborator: { name: string | null; email: string }
    listing: { project: { title: string } }
  }
}

export default function HandshakePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [sessionUser, setSessionUser] = useState<{ sub: string; name: string } | null>(null)
  const [data, setData] = useState<HandshakeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Form state
  const [ipClause, setIpClause] = useState('Equal Co-ownership')
  const [signatureName, setSignatureName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/auth/me')
        if (!sessionRes.ok) throw new Error('Not logged in')
        const user = await sessionRes.json()
        setSessionUser(user)

        const res = await fetch(`/api/collaborations/${id}/handshake`)
        if (!res.ok) throw new Error('Failed to load agreement')
        
        const handshake = await res.json()
        setData(handshake)
        setIpClause(handshake.ipClause)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSaveTerms() {
    if (!data) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/collaborations/${id}/handshake`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipClause })
      })
      if (!res.ok) throw new Error('Failed to save terms')
      const updated = await res.json()
      setData({ ...data, ...updated })
      alert('Terms saved')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSign(e: React.FormEvent) {
    e.preventDefault()
    if (!signatureName.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/collaborations/${id}/handshake/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signatureName })
      })
      if (!res.ok) throw new Error('Failed to sign')
      
      // Reload page to see updated state
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading agreement...</div>
  if (error || !data || !sessionUser) return <div className="p-8 text-center text-red-500">{error || 'Unable to load'}</div>

  const isInitiator = data.collaboration.initiatorId === sessionUser.sub
  const isCollaborator = data.collaboration.collaboratorId === sessionUser.sub
  
  const hasInitiatorSigned = !!data.initiatorSignature
  const hasCollaboratorSigned = !!data.collaboratorSignature
  const isFullySigned = hasInitiatorSigned && hasCollaboratorSigned

  const myRole = isInitiator ? 'initiator' : isCollaborator ? 'collaborator' : null
  const haveISigned = myRole === 'initiator' ? hasInitiatorSigned : hasCollaboratorSigned

  const canEdit = !hasInitiatorSigned && !hasCollaboratorSigned

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-indigo-600 hover:underline mb-6 block">
          &larr; Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-900 px-8 py-10 text-white text-center">
            <h1 className="text-2xl font-serif mb-2">Handshake Agreement</h1>
            <p className="text-indigo-200">
              For the project: <strong className="text-white">{data.collaboration.listing.project.title}</strong>
            </p>
          </div>

          <div className="p-8 prose prose-indigo max-w-none">
            <p className="text-gray-500 italic text-sm text-center mb-8 border-b pb-8">
              This agreement outlines the terms of collaboration between{' '}
              <strong>{data.collaboration.initiator.name}</strong> (Initiator) and{' '}
              <strong>{data.collaboration.collaborator.name}</strong> (Collaborator).
              It must be signed by both parties before Vault access is granted.
            </p>

            <h3>1. The Project</h3>
            <p>{data.projectDescription}</p>

            <h3>2. Collaborator Role & Contribution</h3>
            <p>{data.collaboratorRole}</p>

            <h3>3. Intellectual Property</h3>
            {canEdit ? (
              <select
                value={ipClause}
                onChange={(e) => setIpClause(e.target.value)}
                className="w-full mt-2 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="Equal Co-ownership">Equal Co-ownership (50/50 split)</option>
                <option value="Creator Retains All">Creator Retains All (Work for hire / volunteer)</option>
                <option value="Custom">Custom (Negotiated off-platform)</option>
              </select>
            ) : (
              <p className="font-medium text-gray-900 border-l-4 border-indigo-100 pl-4 py-1">{data.ipClause}</p>
            )}

            <h3>4. Credit & Attribution</h3>
            <p>{data.creditAgreement}</p>

            <h3>5. Confidentiality & Exit</h3>
            <p><strong>Confidentiality:</strong> {data.confidentiality}</p>
            <p><strong>Withdrawal:</strong> {data.exitClause}</p>

            {canEdit && (
              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleSaveTerms}
                  disabled={isSubmitting}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Save Draft Terms
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 border-t border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 shrink-0">Signatures</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Initiator */}
              <div className="space-y-4">
                <div className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Initiator</div>
                {hasInitiatorSigned ? (
                  <div className="bg-white border-2 border-green-100 p-4 rounded-xl">
                    <p className="font-serif text-xl text-gray-900 italic">{data.initiatorSignature}</p>
                    <p className="text-xs text-gray-500 mt-2">Signed: {new Date(data.initiatorSignedAt!).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 border-dashed p-4 rounded-xl h-[92px] flex items-center justify-center text-sm text-gray-400">
                    Pending Signature
                  </div>
                )}
              </div>

              {/* Collaborator */}
              <div className="space-y-4">
                <div className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Collaborator</div>
                {hasCollaboratorSigned ? (
                  <div className="bg-white border-2 border-green-100 p-4 rounded-xl">
                    <p className="font-serif text-xl text-gray-900 italic">{data.collaboratorSignature}</p>
                    <p className="text-xs text-gray-500 mt-2">Signed: {new Date(data.collaboratorSignedAt!).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 border-dashed p-4 rounded-xl h-[92px] flex items-center justify-center text-sm text-gray-400">
                    Pending Signature
                  </div>
                )}
              </div>
            </div>

            {/* Signing Form */}
            {!haveISigned && (
              <form onSubmit={handleSign} className="mt-8 pt-8 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Sign to agree to terms (Type your full legal name)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="flex-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 font-serif"
                    placeholder="e.g. John Doe"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !signatureName.trim()}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Sign Agreement
                  </button>
                </div>
              </form>
            )}

            {isFullySigned && data.pdfS3Key && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl">✅</span>
                </div>
                <h3 className="text-green-900 font-medium">Agreement Executed</h3>
                <p className="text-green-800 text-sm mt-1">Both parties have signed. Vault access is now unlocked.</p>
                <p className="text-xs text-green-700 mt-4 opacity-75 break-all max-w-full">
                  Archived locally at: {data.pdfS3Key}
                </p>
                <Link href={`/vault/${data.collaboration.listing.project.id}`} className="mt-6 bg-white border border-green-300 text-green-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-50">
                  Enter Vault
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
