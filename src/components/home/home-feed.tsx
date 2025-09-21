'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { MemeCard } from '@/components/ui/meme-card'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import { ReelViewer } from '@/components/ui/reel-viewer'
import { AuthStatus } from '@/components/auth/auth-status'
import { SearchBar } from '@/components/ui/search-bar'
import { Plus, Clock, Calendar, CalendarRange } from 'lucide-react'
import Link from 'next/link'

interface Meme {
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
  tags?: {
    tag: {
      id: string
      name: string
    }
  }[]
  _count?: {
    comments: number
  }
}

type TimeframeType = 'daily' | 'weekly' | 'monthly'

export function HomeFeed() {
  const { data: session, status } = useSession()
  const [memes, setMemes] = useState<Meme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest')
  const [timeframe, setTimeframe] = useState<TimeframeType>('daily')
  const [reelIndex, setReelIndex] = useState(0)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<Meme[]>([])
  const [showReel, setShowReel] = useState(false)

  const handleSearchResults = (results: Meme[]) => {
    setSearchResults(results)
    setShowSearchResults(results.length > 0)
  }

  // Check if user is actually authenticated
  const isAuthenticated = status === 'authenticated' && session?.user

  const loadMemes = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      setIsLoading(true)
      let url = `/api/memes?page=${page}&limit=10&sort=${sortBy}`
      
      // Add timeframe parameter for trending
      if (sortBy === 'trending') {
        url += `&timeframe=${timeframe}`
      }
      
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        
        if (reset) {
          setMemes(data.memes)
        } else {
          setMemes(prev => [...prev, ...data.memes])
        }
        
        setHasMore(data.hasMore)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Failed to load memes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sortBy, timeframe])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadMemes(currentPage + 1, false)
    }
  }, [currentPage, hasMore, isLoading, loadMemes])

  const handleSortChange = (newSort: 'latest' | 'popular' | 'trending') => {
    setSortBy(newSort)
    setCurrentPage(1)
    setMemes([])
    setHasMore(true)
  }

  const handleTimeframeChange = (newTimeframe: TimeframeType) => {
    setTimeframe(newTimeframe)
    if (sortBy === 'trending') {
      setCurrentPage(1)
      setMemes([])
      setHasMore(true)
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
        const data = await response.json()
        setMemes(prev => prev.map(meme => 
          meme.id === memeId 
            ? { ...meme, upvotes: data.upvotes, downvotes: data.downvotes }
            : meme
        ))
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const handleFavorite = async (memeId: string) => {
    if (!isAuthenticated) return

    try {
      const response = await fetch('/api/memes/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memeId }),
      })

      if (response.ok) {
        // Handle favorite state update if needed
      }
    } catch (error) {
      console.error('Failed to favorite:', error)
    }
  }

  const handleShare = async (memeId: string) => {
    try {
      const response = await fetch('/api/memes/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memeId }),
      })

      if (response.ok) {
        setMemes(prev => prev.map(meme => 
          meme.id === memeId 
            ? { ...meme, shareCount: meme.shareCount + 1 }
            : meme
        ))
      }
    } catch (error) {
      console.error('Failed to update share count:', error)
    }
  }

  const handleDelete = async (memeId: string) => {
    // Remove the meme from the list
    setMemes(prev => prev.filter(meme => meme.id !== memeId))
  }

  const openReelViewer = (index: number) => {
    setReelIndex(index)
    setShowReel(true)
  }

  const closeReelViewer = () => {
    setShowReel(false)
  }

  useEffect(() => {
    loadMemes(1, true)
  }, [loadMemes])

  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      <AuthStatus />
      
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Feed</h1>
          <p className="text-gray-600 mt-1">
            {isAuthenticated 
              ? `Welcome back, ${session.user?.displayName || session.user?.username}!`
              : 'Discover the funniest memes on the internet'
            }
          </p>
        </div>
        
        {isAuthenticated && (
          <Link
            href="/upload"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Plus size={16} className="mr-2" />
            Upload Meme
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="animate-fade-in-delay-2">
        <SearchBar 
          placeholder="Search memes by title, description, tags, or author..."
          onResults={handleSearchResults}
          showResults={false}
          className="max-w-md"
        />
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between animate-fade-in-delay-1">
        <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-gray-200 w-fit">
          {[
            { key: 'latest', label: 'Latest' },
            { key: 'popular', label: 'Popular' },
            { key: 'trending', label: 'Trending' }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => handleSortChange(option.key as 'latest' | 'popular' | 'trending')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 transform hover:scale-105 ${
                sortBy === option.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Timeframe Selector */}
      {sortBy === 'trending' && (
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit animate-fade-in">
          {[
            { value: 'daily' as TimeframeType, label: 'Today', icon: Clock },
            { value: 'weekly' as TimeframeType, label: 'This Week', icon: Calendar },
            { value: 'monthly' as TimeframeType, label: 'This Month', icon: CalendarRange }
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleTimeframeChange(value)}
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
      )}

      {/* Memes Feed */}
      {showSearchResults ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results ({searchResults.length})
            </h2>
            <button
              onClick={() => setShowSearchResults(false)}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Back to feed
            </button>
          </div>
          {searchResults.map((meme, index) => (
            <MemeCard
              key={meme.id}
              meme={meme}
              onVote={handleVote}
              onFavorite={handleFavorite}
              onShare={handleShare}
              onDelete={handleDelete}
              onPlayReel={() => openReelViewer(index)}
            />
          ))}
        </div>
      ) : memes.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Plus size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No memes yet</h3>
          <p className="text-gray-600 mb-4">
            Be the first to share a meme with the community!
          </p>
          {isAuthenticated ? (
            <Link
              href="/upload"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Upload Your First Meme
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              Sign In to Upload
            </Link>
          )}
        </div>
      ) : (
        <InfiniteScroll
          hasMore={hasMore}
          isLoading={isLoading}
          loadMore={loadMore}
          className="space-y-6"
        >
          {memes.map((meme, index) => (
            <MemeCard
              key={meme.id}
              meme={meme}
              onVote={handleVote}
              onFavorite={handleFavorite}
              onShare={handleShare}
              onDelete={handleDelete}
              onPlayReel={() => openReelViewer(index)}
            />
          ))}
        </InfiniteScroll>
      )}

      {/* Anonymous user CTA */}
      {!isAuthenticated && memes.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-indigo-900 mb-2">
            Join MemeHub to interact with memes!
          </h3>
          <p className="text-indigo-700 mb-4">
            Sign up to upvote, save favorites, and share your own memes.
          </p>
          <div className="space-x-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 text-sm font-medium rounded-md border border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* Reel Viewer Modal */}
      {showReel && (
        <ReelViewer
          memes={memes}
          initialIndex={reelIndex}
          onVote={handleVote}
          onFavorite={handleFavorite}
          onShare={handleShare}
          onClose={closeReelViewer}
          onLoadMore={loadMore}
          hasMore={hasMore}
          sortBy={sortBy}
        />
      )}
    </div>
  )
}