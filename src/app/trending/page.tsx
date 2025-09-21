'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { MemeCard } from '@/components/ui/meme-card'
import { Flame, Clock, Calendar, CalendarRange } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface TrendingMeme {
  id: string
  title: string
  description?: string
  imageUrl: string
  memeType: 'IMAGE' | 'GIF' | 'VIDEO'
  upvotes: number
  downvotes: number
  views: number
  shareCount: number
  createdAt: string
  author: {
    id: string
    username: string
    displayName?: string
    avatar?: string
  }
  _count: {
    comments: number
  }
  trendingScore: number
}

interface TrendingResponse {
  memes: TrendingMeme[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
  }
  timeframe: string
}

type TimeframeType = 'daily' | 'weekly' | 'monthly'

export default function TrendingPage() {
  const { data: session, status } = useSession()
  const [memes, setMemes] = useState<TrendingMeme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<TimeframeType>('daily')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const isAuthenticated = status === 'authenticated' && session?.user

  const fetchTrendingMemes = async (currentTimeframe: TimeframeType, currentPage: number, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(
        `/api/memes/trending?timeframe=${currentTimeframe}&page=${currentPage}&limit=10`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch trending memes')
      }

      const data: TrendingResponse = await response.json()
      
      if (reset) {
        setMemes(data.memes)
      } else {
        setMemes(prev => [...prev, ...data.memes])
      }
      
      setHasMore(data.pagination.hasNext)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchTrendingMemes(timeframe, 1, true)
  }, [timeframe])

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchTrendingMemes(timeframe, nextPage)
    }
  }

  const handleVote = async (memeId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!isAuthenticated) return

    try {
      const response = await fetch('/api/memes/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memeId, voteType }),
      })

      if (response.ok) {
        // Refresh trending memes to reflect new scores
        fetchTrendingMemes(timeframe, 1, true)
        setPage(1)
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleFavorite = async (memeId: string) => {
    if (!isAuthenticated) return

    try {
      await fetch('/api/memes/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memeId }),
      })
    } catch (error) {
      console.error('Error favoriting:', error)
    }
  }

  const handleShare = async (memeId: string) => {
    try {
      await fetch('/api/memes/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memeId }),
      })
      
      // Update share count locally
      setMemes(prev => prev.map(meme => 
        meme.id === memeId 
          ? { ...meme, shareCount: meme.shareCount + 1 }
          : meme
      ))
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const timeframeOptions = [
    { value: 'daily' as TimeframeType, label: 'Today', icon: Clock },
    { value: 'weekly' as TimeframeType, label: 'This Week', icon: Calendar },
    { value: 'monthly' as TimeframeType, label: 'This Month', icon: CalendarRange },
  ]

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Flame className="text-orange-500" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Trending Memes</h1>
          </div>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Flame className="text-orange-500" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Trending Memes</h1>
          </div>
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Trending</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchTrendingMemes(timeframe, 1, true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Flame className="text-orange-500" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Trending Memes</h1>
          </div>
          <p className="text-gray-600">
            Discover the hottest memes right now
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          {timeframeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTimeframe(value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeframe === value
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Trending Memes */}
        {memes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Flame className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Trending Memes
            </h3>
            <p className="text-gray-600">
              No memes are trending in this timeframe yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {memes.map((meme, index) => (
              <div key={meme.id} className="relative">
                {/* Trending Rank */}
                <div className="absolute -left-2 top-4 z-10">
                  <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    #{index + 1}
                  </div>
                </div>
                <MemeCard
                  meme={meme}
                  onVote={handleVote}
                  onFavorite={handleFavorite}
                  onShare={handleShare}
                />
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center py-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}