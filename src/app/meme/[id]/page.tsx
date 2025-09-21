'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { MemeCard } from '@/components/ui/meme-card'
import { Comments } from '@/components/ui/comments'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface MemeDetail {
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

interface MemePageProps {
  params: Promise<{
    id: string
  }>
}

export default function MemePage({ params }: MemePageProps) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [meme, setMeme] = useState<MemeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = status === 'authenticated' && session?.user

  const fetchMeme = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/memes/${resolvedParams.id}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Meme not found')
        }
        throw new Error('Failed to fetch meme')
      }

      const data: MemeDetail = await response.json()
      setMeme(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeme()
  }, [resolvedParams.id])

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
        // Refresh meme data to reflect new scores
        fetchMeme()
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
      setMeme(prev => {
        if (!prev) return prev
        return { ...prev, shareCount: prev.shareCount + 1 }
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleDelete = async (memeId: string) => {
    // Redirect to home page after successful deletion
    router.push('/')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (error || !meme) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error === 'Meme not found' ? 'Meme Not Found' : 'Error Loading Meme'}
          </h3>
          <p className="text-gray-600 mb-4">
            {error === 'Meme not found' 
              ? 'This meme does not exist or has been removed.'
              : error || 'Something went wrong while loading this meme.'}
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

        {/* Meme Detail */}
        <div className="max-w-2xl mx-auto space-y-6">
          <MemeCard
            meme={meme}
            onVote={handleVote}
            onFavorite={handleFavorite}
            onShare={handleShare}
            onDelete={handleDelete}
          />
          
          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Comments memeId={resolvedParams.id} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}