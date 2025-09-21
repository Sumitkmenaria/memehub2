'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Compass, 
  Upload, 
  User, 
  LogOut, 
  LogIn,
  Heart
} from 'lucide-react'

interface NavigationProps {
  showTopBar?: boolean
}

export function Navigation({ showTopBar = true }: NavigationProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [lastScrollY, setLastScrollY] = useState(0)

  const isActive = (path: string) => pathname === path

  // Only show authenticated features if user is actually logged in
  const isAuthenticated = status === 'authenticated' && session?.user

  // Remove duplicate scroll handling since it's now handled in AppLayout

  // Mobile tab items (always visible)
  const mobileNavItems = [
    { href: '/', icon: Home, label: 'Home', key: 'home' },
    { href: '/discover', icon: Compass, label: 'Discover', key: 'discover' },
    { 
      href: isAuthenticated ? '/upload' : '/auth/signin', 
      icon: Upload, 
      label: 'Upload', 
      key: 'upload'
    },
    { 
      href: isAuthenticated ? '/favorites' : '/auth/signin', 
      icon: Heart, 
      label: 'Favorites', 
      key: 'favorites'
    },
    { 
      href: isAuthenticated ? `/profile/${session.user?.username}` : '/auth/signin', 
      icon: User, 
      label: isAuthenticated ? (session.user?.displayName?.split(' ')[0] || session.user?.username || 'Profile') : 'Profile',
      key: 'profile'
    }
  ]

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <nav className={`lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40 transition-transform duration-300 ${
        showTopBar ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="px-4 sm:px-6">
          <div className="flex justify-center items-center h-16">
            <Link href="/" className="text-xl font-bold text-indigo-600 transition-colors hover:text-indigo-700">
              MemeHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tabs */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 transition-all duration-300">
        <div className="flex justify-around items-center py-2">
          {mobileNavItems.map((item) => {
            const isCurrentActive = isActive(item.href)
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-all duration-200 transform hover:scale-105 ${
                  isCurrentActive
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <item.icon 
                  size={20} 
                  className={`mb-1 transition-colors duration-200 ${
                    isCurrentActive ? 'text-indigo-600' : 'text-gray-400'
                  }`} 
                />
                <span className={`text-xs font-medium transition-colors duration-200 ${
                  isCurrentActive ? 'text-indigo-600' : 'text-gray-600'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              MemeHub
            </Link>
          </div>
          
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon 
                    size={20} 
                    className={`mr-4 flex-shrink-0 ${
                      isActive(item.href) ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} 
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
            
            <div className="flex-shrink-0 p-4 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {(session.user?.displayName || session.user?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {session.user?.displayName || session.user?.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        @{session.user?.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogIn size={16} className="mr-3" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}