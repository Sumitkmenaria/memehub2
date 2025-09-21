'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { AppLayout } from '@/components/layout/app-layout'
import { MemeCard } from '@/components/ui/meme-card'
import { Tag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface TagMeme {
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
}

interface TagPageProps {
  params: Promise<{
    name: string
  }>
}

export default function TagPage({ params }: TagPageProps) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const [memes, setMemes] = useState<TagMeme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const isAuthenticated = status === 'authenticated' && session?.user
  const tagName = decodeURIComponent(resolvedParams.name)

  const fetchMemes = async (pageNum = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setError(null)
      }

      const response = await fetch(`/api/tags/${encodeURIComponent(tagName)}?page=${pageNum}&limit=10`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tag not found')
        }
        throw new Error('Failed to fetch memes')
      }

      const data = await response.json()
      
      if (reset) {
        setMemes(data.memes)
      } else {
        setMemes(prev => [...prev, ...data.memes])
      }
      
      setHasMore(data.pagination.hasNext)
      setTotal(data.pagination.total)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemes(1, true)
  }, [tagName])

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchMemes(page + 1)
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
        // Refresh memes to reflect new scores
        fetchMemes(1, true)
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

  if (loading && memes.length === 0) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error === 'Tag not found' ? 'Tag Not Found' : 'Error Loading Tag'}
          </h3>
          <p className="text-gray-600 mb-4">
            {error === 'Tag not found' 
              ? 'This tag does not exist or has no associated memes.'
              : error || 'Something went wrong while loading this tag.'}
          </p>
          <Link
            href="/"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to feed</span>
          </Link>
        </div>

        {/* Tag Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
              <Tag className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">#{tagName}</h1>
              <p className="text-gray-600">
                {total} {total === 1 ? 'meme' : 'memes'} with this tag
              </p>
            </div>
          </div>
        </div>

        {/* Memes */}
        <div>
          {memes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Tag className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Memes Found</h3>
              <p className="text-gray-600">
                No memes have been tagged with #{tagName} yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {memes.map((meme) => (
                <MemeCard
                  key={meme.id}
                  meme={meme}
                  onVote={handleVote}
                  onFavorite={handleFavorite}
                  onShare={handleShare}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center py-6">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
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
      </div>
    </AppLayout>
  )
}