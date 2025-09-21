'use client'

import { useSession } from 'next-auth/react'
import { User, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { showSuccess } from '@/components/ui/notification-system'

export function AuthStatus() {
  const { data: session, status, update } = useSession()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Force session refresh on mount and show login toast
  useEffect(() => {
    const refreshSession = async () => {
      setIsRefreshing(true)
      try {
        await update()
      } catch (error) {
        console.error('Failed to refresh session:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    refreshSession()
  }, [])

  // Show success toast when user logs in
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !isRefreshing) {
      showSuccess('Successfully logged in!')
    }
  }, [status, session, isRefreshing])

  if (status === 'loading' || isRefreshing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-500 mr-3 animate-spin" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Checking Authentication</h3>
            <p className="text-sm text-blue-600">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  // Don't show any authentication status message - handled by toast
  if (status === 'authenticated' && session?.user) {
    return null
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <XCircle className="h-5 w-5 text-gray-500 mr-3" />
        <div>
          <h3 className="text-sm font-medium text-gray-800">Not Logged In</h3>
          <p className="text-sm text-gray-600">
            Sign in to access all features (Current status: {status})
          </p>
        </div>
      </div>
    </div>
  )
}