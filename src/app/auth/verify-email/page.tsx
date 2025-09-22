'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/notification-system'

// Separate component that uses useSearchParams
function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    // Verify the email
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message)
          showSuccess('Email verified successfully!')
          
          // Redirect to signin page after a delay
          setTimeout(() => {
            router.push('/auth/signin?message=Email verified! You can now sign in.')
          }, 3000)
        } else {
          if (data.error.includes('expired')) {
            setStatus('expired')
          } else {
            setStatus('error')
          }
          setMessage(data.error)
          showError(data.error)
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
        showError('Verification failed')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  const handleResendVerification = async () => {
    // This would need the user's email - for now, redirect to a resend page
    router.push('/auth/resend-verification')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Verifying Your Email
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Please wait while we verify your email address...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Email Verified!
                </h2>
                <p className="mt-2 text-sm text-gray-600 mb-6">
                  {message}
                </p>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm text-green-700">
                      🎉 Welcome to MemeHub! Your account is now fully activated.
                    </p>
                  </div>
                  <Link
                    href="/auth/signin"
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Continue to Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </>
            )}

            {status === 'expired' && (
              <>
                <XCircle className="mx-auto h-12 w-12 text-yellow-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Verification Link Expired
                </h2>
                <p className="mt-2 text-sm text-gray-600 mb-6">
                  Your verification link has expired. Please request a new one.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleResendVerification}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </button>
                  <Link
                    href="/auth/signin"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="mx-auto h-12 w-12 text-red-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Verification Failed
                </h2>
                <p className="mt-2 text-sm text-gray-600 mb-6">
                  {message}
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleResendVerification}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Request New Verification Email
                  </button>
                  <Link
                    href="/auth/signin"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function VerifyEmailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )
}

// Main page component with Suspense wrapper
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  )
}