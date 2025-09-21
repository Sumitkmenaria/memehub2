'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check } from 'lucide-react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
}

interface NotificationSystemProps {
  children: React.ReactNode
}

// Global notification state
let toasts: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

// Global methods to add notifications
export const addNotification = (toast: Omit<Toast, 'id'>) => {
  const newToast = {
    ...toast,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    duration: toast.duration || 5000,
  }
  
  toasts = [newToast, ...toasts]
  listeners.forEach(listener => listener([...toasts]))
  
  // Auto remove after duration
  if (newToast.duration > 0) {
    setTimeout(() => {
      removeNotification(newToast.id)
    }, newToast.duration)
  }
}

export const removeNotification = (id: string) => {
  toasts = toasts.filter(toast => toast.id !== id)
  listeners.forEach(listener => listener([...toasts]))
}

export const clearAllNotifications = () => {
  toasts = []
  listeners.forEach(listener => listener([...toasts]))
}

// Convenience methods
export const showSuccess = (title: string, message: string = '') => {
  addNotification({ type: 'success', title, message })
}

export const showError = (title: string, message: string = '') => {
  addNotification({ type: 'error', title, message })
}

export const showInfo = (title: string, message: string = '') => {
  addNotification({ type: 'info', title, message })
}

export const showWarning = (title: string, message: string = '') => {
  addNotification({ type: 'warning', title, message })
}

export function NotificationSystem({ children }: NotificationSystemProps) {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToastsChange = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts)
    }

    listeners.push(handleToastsChange)

    return () => {
      listeners = listeners.filter(listener => listener !== handleToastsChange)
    }
  }, [])

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <Check size={16} className="text-green-600" />
      case 'error':
        return <X size={16} className="text-red-600" />
      case 'warning':
        return <Bell size={16} className="text-yellow-600" />
      case 'info':
      default:
        return <Bell size={16} className="text-blue-600" />
    }
  }

  return (
    <>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {currentToasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              ${getToastStyles(toast.type)}
              border rounded-lg p-4 shadow-lg transform transition-all duration-300 ease-in-out
              animate-in slide-in-from-right-1 fade-in
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 pt-0.5">
                {getToastIcon(toast.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="text-sm opacity-90 mt-1">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeNotification(toast.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}