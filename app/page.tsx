import { redirect } from 'next/navigation'

// Middleware handles auth redirects; this is a fallback for the root path
export default function HomePage() {
  redirect('/dashboard')
}
