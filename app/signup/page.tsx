import Link from 'next/link'
import AuthForm from '@/components/AuthForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-semibold mb-6">Create Account</h1>
      <AuthForm mode="signup" />
      <p className="mt-4 text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-gray-900 font-medium underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
