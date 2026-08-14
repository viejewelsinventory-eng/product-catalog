import Link from 'next/link'
import AuthForm from '@/components/AuthForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-semibold mb-6">Log In</h1>
      <AuthForm mode="login" />
      <p className="mt-4 text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-gray-900 font-medium underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
