import ProfileForm from '@/components/ProfileForm'

export default function ProfileSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resurrect</h1>
          <p className="text-gray-500 mt-2">One last step — tell us about yourself</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Set up your profile</h2>
          <ProfileForm isSetup />
        </div>
      </div>
    </div>
  )
}
