'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Navigation } from './navigation'
import { NotificationSystem } from '@/components/ui/notification-system'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [showTopBar, setShowTopBar] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide top bar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowTopBar(false)
      } else {
        setShowTopBar(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    // Throttle scroll events for better performance
    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    return () => window.removeEventListener('scroll', throttledHandleScroll)
  }, [lastScrollY])

  return (
    <NotificationSystem>
      <div className="min-h-screen bg-gray-50">
        <Navigation showTopBar={showTopBar} />
        
        {/* Main content area */}
        <div className="lg:pl-64">
          <main className="flex-1">
            <div className="py-6 pb-20 lg:pb-6"> {/* Add bottom padding on mobile for tab navigation */}
              <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </NotificationSystem>
  )
}