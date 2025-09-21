'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, Share, ChevronUp, ChevronDown, Bookmark, Trash2, MoreVertical, Play } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { showSuccess, showError } from '@/components/ui/notification-system'

interface MemeCardProps {
  meme: {
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
  onVote?: (memeId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => void
  onFavorite?: (memeId: string) => void
  onShare?: (memeId: string) => void
  onDelete?: (memeId: string) => void
  onPlayReel?: () => void
  isCompact?: boolean
}

export function MemeCard({ 
  meme, 
  onVote, 
  onFavorite, 
  onShare, 
  onDelete,
  onPlayReel,
  isCompact = false 
}: MemeCardProps) {
  const { data: session, status } = useSession()
  const [userVote, setUserVote] = useState<'UPVOTE' | 'DOWNVOTE' | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if user is actually authenticated
  const isAuthenticated = status === 'authenticated' && session?.user

  const handleVote = (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!isAuthenticated) return
    
    const newVote = userVote === voteType ? null : voteType
    setUserVote(newVote)
    onVote?.(meme.id, voteType)
  }

  const handleFavorite = () => {
    if (!isAuthenticated) return
    
    setIsFavorited(!isFavorited)
    onFavorite?.(meme.id)
  }

  const handleShare = async () => {
    setIsSharing(true)
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: meme.title,
          text: meme.description,
          url: `${window.location.origin}/meme/${meme.id}`,
        })
        onShare?.(meme.id)
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/meme/${meme.id}`)
        onShare?.(meme.id)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
    
    setIsSharing(false)
  }

  const scoreColor = meme.upvotes - meme.downvotes > 0 
    ? 'text-green-600' 
    : meme.upvotes - meme.downvotes < 0 
    ? 'text-red-600' 
    : 'text-gray-600'

  // Check if current user owns this meme
  const isOwner = isAuthenticated && session?.user?.email && meme.author.id === session.user.id 
  const handleDelete = async () => {
    if (!isAuthenticated || isDeleting) return
    
    if (!confirm('Are you sure you want to delete this meme? This action cannot be undone.')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/memes/${meme.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccess('Meme deleted', 'Your meme has been successfully deleted')
        onDelete?.(meme.id)
      } else {
        showError('Delete failed', 'Failed to delete meme. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting meme:', error)
      showError('Delete failed', 'An error occurred while deleting the meme')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
      isCompact ? 'mb-2' : 'mb-4'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <Link href={`/profile/${meme.author.username}`} className="flex items-center space-x-2">
          {meme.author.avatar ? (
            <Image
              src={meme.author.avatar}
              alt={meme.author.displayName || meme.author.username}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {(meme.author.displayName || meme.author.username).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-sm text-gray-900">
              {meme.author.displayName || meme.author.username}
            </p>
            <p className="text-xs text-gray-500">
              @{meme.author.username}
            </p>
          </div>
        </Link>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {new Date(meme.createdAt).toLocaleDateString()}
          </span>
          {/* Delete button for meme owner */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Delete meme"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={isCompact ? 'px-3' : 'px-0'}>
        {!isCompact && (
          <Link href={`/meme/${meme.id}`} className="block px-3 pb-2 hover:bg-gray-50 transition-colors">
            <h3 className="font-semibold text-gray-900 mb-1 hover:text-indigo-600 transition-colors">{meme.title}</h3>
            {meme.description && (
              <p className="text-gray-700 text-sm mb-2">{meme.description}</p>
            )}
          </Link>
        )}

        {/* Meme Image/Video - Clickable to navigate to meme page */}
        <div className="block relative bg-gray-100">
          <Link href={`/meme/${meme.id}`} className="block cursor-pointer hover:opacity-95 transition-opacity">
            {meme.memeType === 'VIDEO' ? (
              <video
                controls
                className="w-full max-h-96 object-contain"
                poster={meme.imageUrl}
                preload="metadata"
                playsInline
                onClick={(e) => e.stopPropagation()} // Prevent navigation when using video controls
              >
                <source src={meme.imageUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={meme.imageUrl}
                alt={meme.title}
                width={600}
                height={400}
                className="w-full max-h-96 object-contain"
                priority={false}
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            )}
          </Link>
          
          {/* Play Reel Button Overlay */}
          {onPlayReel && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onPlayReel()
              }}
              className="absolute top-3 right-3 p-2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80 transition-all transform hover:scale-110"
              title="Watch in Reel Mode"
            >
              <Play size={16} fill="currentColor" />
            </button>
          )}
        </div>

        {/* Tags */}
        {!isCompact && meme.tags && meme.tags.length > 0 && (
          <div className="px-3 py-2 flex flex-wrap gap-1">
            {meme.tags.slice(0, 3).map((tagRelation) => (
              <Link
                key={tagRelation.tag.id}
                href={`/tag/${tagRelation.tag.name}`}
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                #{tagRelation.tag.name}
              </Link>
            ))}
            {meme.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{meme.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* Vote buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleVote('UPVOTE')}
              disabled={!isAuthenticated}
              className={`p-1 rounded-full transition-colors ${
                userVote === 'UPVOTE' 
                  ? 'bg-green-100 text-green-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronUp size={18} />
            </button>
            <span className={`text-sm font-medium ${scoreColor} min-w-[2rem] text-center`}>
              {meme.upvotes - meme.downvotes}
            </span>
            <button
              onClick={() => handleVote('DOWNVOTE')}
              disabled={!isAuthenticated}
              className={`p-1 rounded-full transition-colors ${
                userVote === 'DOWNVOTE' 
                  ? 'bg-red-100 text-red-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            {/* Comments */}
            <Link
              href={`/meme/${meme.id}`}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="text-sm">{meme._count?.comments || 0}</span>
            </Link>

            {/* Favorite */}
            <button
              onClick={handleFavorite}
              disabled={!isAuthenticated}
              className={`p-1 rounded-full transition-colors ${
                isFavorited 
                  ? 'text-red-600' 
                  : 'text-gray-600 hover:text-gray-800'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Bookmark size={18} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              <Share size={18} />
              <span className="text-sm">{meme.shareCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}