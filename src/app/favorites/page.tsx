'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AppLayout } from '@/components/layout/app-layout'
import { MemeCard } from '@/components/ui/meme-card'
import { Heart, Plus } from 'lucide-react'
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

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const [favorites, setFavorites] = useState<Meme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const isAuthenticated = status === 'authenticated' && session?.user

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const loadFavorites = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/memes/favorite')
      
      if (response.ok) {
        const data = await response.json()
        setFavorites(data.favorites)
      } else {
        setError('Failed to load favorites')
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
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
        setFavorites(prev => prev.map(meme => 
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
        // Remove from favorites list
        setFavorites(prev => prev.filter(meme => meme.id !== memeId))
      }
    } catch (error) {
      console.error('Failed to unfavorite:', error)
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
        const data = await response.json()
        setFavorites(prev => prev.map(meme => 
          meme.id === memeId 
            ? { ...meme, shareCount: data.shareCount }
            : meme
        ))
      }
    } catch (error) {
      console.error('Failed to update share count:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Heart size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to view favorites</h3>
          <p className="text-gray-600 mb-4">
            Save your favorite memes and access them anytime!
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Favorite Memes</h1>
          <p className="text-gray-600 mt-1">
            Your saved memes collection
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading favorites</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadFavorites}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Heart size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-4">
              Start saving your favorite memes by clicking the bookmark icon!
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Browse Memes
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {favorites.map((meme) => (
              <MemeCard
                key={meme.id}
                meme={meme}
                onVote={handleVote}
                onFavorite={handleFavorite}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}