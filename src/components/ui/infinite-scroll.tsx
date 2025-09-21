'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

interface InfiniteScrollProps {
  children: ReactNode
  hasMore: boolean
  isLoading: boolean
  loadMore: () => void
  threshold?: number
  className?: string
  loadingComponent?: ReactNode
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  loadMore,
  threshold = 0.1,
  className = '',
  loadingComponent
}: InfiniteScrollProps) {
  const { ref, inView } = useInView({
    threshold,
    rootMargin: '100px'
  })

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore()
    }
  }, [inView, hasMore, isLoading, loadMore])

  const defaultLoadingComponent = (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )

  return (
    <div className={className}>
      {children}
      
      {/* Loading trigger */}
      <div ref={ref} className="w-full">
        {isLoading && (loadingComponent || defaultLoadingComponent)}
      </div>
      
      {/* End message */}
      {!hasMore && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">You've reached the end! 🎉</p>
          <p className="text-xs mt-1">No more memes to load</p>
        </div>
      )}
    </div>
  )
}