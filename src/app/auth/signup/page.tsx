'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/notification-system'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          displayName: displayName || username,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setUserEmail(email)
        setShowVerificationMessage(true)
        showSuccess('Account created! Please check your email for verification.')
      } else {
        setError(data.error || 'Something went wrong')
        showError(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Something went wrong. Please try again.')
      showError('Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Show verification message after successful registration
  if (showVerificationMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Account Created Successfully!
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Verify your email address
                      </p>
                      <p className="text-sm text-blue-700">
                        We've sent a verification email to <strong>{userEmail}</strong>. 
                        Click the link in the email to activate your account.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>📧 Check your spam folder</strong> if you don't see the email in your inbox.
                  </p>
                </div>
                
                <div className="space-y-3 pt-4">
                  <Link
                    href="/auth/resend-verification"
                    className="w-full flex justify-center py-2 px-4 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                  >
                    Resend Verification Email
                  </Link>
                  
                  <Link
                    href="/auth/signin"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Back to Sign In
                  </Link>
                  
                  <Link
                    href="/"
                    className="block text-center text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Continue browsing as guest
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Back Button */}
      <Link 
        href="/"
        className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 z-10"
      >
        <ArrowLeft size={20} className="mr-2" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 animate-fade-in">
          Join MemeHub
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your account to start sharing memes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 transition-all duration-300 hover:shadow-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="animate-fade-in-delay-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="animate-fade-in-delay-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                  placeholder="Choose a username"
                />
              </div>
            </div>

            <div className="animate-fade-in-delay-3">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name (optional)
              </label>
              <div className="mt-1">
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                  placeholder="Your display name"
                />
              </div>
            </div>

            <div className="animate-fade-in-delay-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div className="animate-fade-in-delay-5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center animate-shake">{error}</div>
            )}

            <div className="animate-fade-in-delay-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center animate-fade-in-delay-7">
            <Link
              href="/auth/signin"
              className="text-indigo-600 hover:text-indigo-500 text-sm transition-colors duration-200"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}