import Link from 'next/link'
import ProjectForm from '@/components/ProjectForm'

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
          <Link
            href="/vault"
            className="text-sm text-indigo-600 hover:underline font-medium"
          >
            Back to Vault
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <ProjectForm />
        </div>
      </div>
    </div>
  )
}
