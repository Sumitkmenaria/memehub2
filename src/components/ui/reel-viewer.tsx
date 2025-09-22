'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, Share, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Bookmark, X, User } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/notification-system'

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

interface Comment {
  id: string
  content: string
  author?: {
    username: string
    displayName?: string
    avatar?: string
  }
  user?: {
    username: string
    displayName?: string
    avatar?: string
  }
  createdAt: string
}

interface ReelViewerProps {
  memes: Meme[]
  initialIndex?: number
  onVote?: (memeId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => void
  onFavorite?: (memeId: string) => void
  onShare?: (memeId: string) => void
  onClose?: () => void
  onLoadMore?: () => void
  hasMore?: boolean
  sortBy?: 'latest' | 'popular' | 'trending'
}

export function ReelViewer({ 
  memes, 
  initialIndex = 0, 
  onVote, 
  onFavorite, 
  onShare, 
  onClose,
  onLoadMore,
  hasMore = false,
  sortBy = 'latest'
}: ReelViewerProps) {
  const { data: session, status } = useSession()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [userVotes, setUserVotes] = useState<Record<string, 'UPVOTE' | 'DOWNVOTE' | null>>({})
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [lastTap, setLastTap] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const isAuthenticated = status === 'authenticated' && session?.user
  const currentMeme = memes[currentIndex]

  // Handle keyboard navigation (up/down and left/right arrows)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'w' || e.key === 'W') {
        handlePrevious()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 's' || e.key === 'S') {
        handleNext()
      } else if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex])

  // Handle wheel scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY > 0) {
        handleNext()
      } else if (e.deltaY < 0) {
        handlePrevious()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [currentIndex])

  // Touch handlers for swipe navigation (horizontal swipe)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX) // Changed from clientY to clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX) // Changed from clientY to clientX
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (distance > minSwipeDistance) {
      // Swipe left - go to next
      handleNext()
    } else if (distance < -minSwipeDistance) {
      // Swipe right - go to previous
      handlePrevious()
    }
  }

  // Double tap to like/unlike
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAuthenticated) return
    
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTap
    
    if (tapLength < 500 && tapLength > 0) {
      e.preventDefault()
      e.stopPropagation()
      
      // Toggle like/unlike based on current vote state
      const currentVote = userVotes[currentMeme.id]
      const newVoteType = currentVote === 'UPVOTE' ? null : 'UPVOTE'
      
      setUserVotes(prev => ({ ...prev, [currentMeme.id]: newVoteType }))
      onVote?.(currentMeme.id, 'UPVOTE')
      
      // Show heart animation
      showLikeAnimation(e)
      
      if (newVoteType === 'UPVOTE') {
        showSuccess('Liked!')
      } else {
        showSuccess('Unliked!')
      }
    }
    
    setLastTap(currentTime)
  }

  const showLikeAnimation = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = 'clientX' in e ? e.clientX - rect.left : e.touches[0].clientX - rect.left
    const y = 'clientY' in e ? e.clientY - rect.top : e.touches[0].clientY - rect.top
    
    const heart = document.createElement('div')
    const currentVote = userVotes[currentMeme.id]
    const willBeUpvoted = currentVote !== 'UPVOTE'
    heart.innerHTML = willBeUpvoted ? '❤️' : '💔'
    heart.className = 'absolute text-6xl animate-ping pointer-events-none z-50 select-none'
    heart.style.left = `${x - 30}px`
    heart.style.top = `${y - 30}px`
    heart.style.transform = 'scale(0)'
    heart.style.animation = 'heartPop 1s ease-out forwards'
    
    // Add custom animation keyframes if not already added
    if (!document.getElementById('heart-animation-styles')) {
      const style = document.createElement('style')
      style.id = 'heart-animation-styles'
      style.textContent = `
        @keyframes heartPop {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(-10deg); opacity: 1; }
          100% { transform: scale(0.8) rotate(0deg); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }
    
    containerRef.current.appendChild(heart)
    
    setTimeout(() => {
      heart.remove()
    }, 1000)
  }

  const handleNext = () => {
    if (currentIndex < memes.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowComments(false)
    } else if (hasMore && onLoadMore) {
      // Load more memes when reaching the end
      onLoadMore()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowComments(false)
    }
  }

  const handleVote = useCallback(async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!isAuthenticated || !currentMeme) return

    const currentVote = userVotes[currentMeme.id]
    const newVote = currentVote === voteType ? null : voteType
    
    setUserVotes(prev => ({ ...prev, [currentMeme.id]: newVote }))
    onVote?.(currentMeme.id, voteType)
    
    if (voteType === 'UPVOTE') {
      showSuccess(newVote === 'UPVOTE' ? 'Liked!' : 'Unliked!')
    }
  }, [isAuthenticated, currentMeme, userVotes, onVote])

  const handleFavorite = useCallback(async () => {
    if (!isAuthenticated || !currentMeme) return
    
    const isFavorited = favorites[currentMeme.id]
    setFavorites(prev => ({ ...prev, [currentMeme.id]: !isFavorited }))
    onFavorite?.(currentMeme.id)
    
    showSuccess(isFavorited ? 'Removed from favorites' : 'Added to favorites')
  }, [isAuthenticated, currentMeme, favorites, onFavorite])

  const handleShare = useCallback(async () => {
    if (!currentMeme) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentMeme.title,
          text: currentMeme.description,
          url: `${window.location.origin}/meme/${currentMeme.id}`,
        })
        onShare?.(currentMeme.id)
      } catch (error) {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/meme/${currentMeme.id}`)
        onShare?.(currentMeme.id)
        showSuccess('Link copied to clipboard!')
      } catch (error) {
        showError('Failed to copy link')
      }
    }
  }, [currentMeme, onShare])

  // Load comments for current meme
  useEffect(() => {
    if (!currentMeme) return
    
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/memes/${currentMeme.id}/comments`)
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments || [])
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
      }
    }
    
    loadComments()
    setNewComment('') // Clear comment input when changing memes
  }, [currentMeme])

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !currentMeme || !newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch(`/api/memes/${currentMeme.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [data.comment, ...prev])
        setNewComment('')
        showSuccess('Comment posted!')
      } else {
        showError('Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      showError('Failed to post comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (!currentMeme) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
      >
        <X size={24} />
      </button>

      {/* Main content */}
      <div 
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleDoubleTap}
      >
        {/* Meme content */}
        <div className="w-full h-full flex items-center justify-center">
          {currentMeme.memeType === 'VIDEO' ? (
            <video
              controls
              className="max-w-full max-h-full object-contain"
              poster={currentMeme.imageUrl}
              preload="metadata"
              playsInline
              autoPlay
              loop
            >
              <source src={currentMeme.imageUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <Image
              src={currentMeme.imageUrl}
              alt={currentMeme.title}
              fill
              className="object-contain"
              priority
              sizes="100vw"
            />
          )}
        </div>

        {/* Overlay UI */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left swipe indicator */}
          {currentIndex > 0 && (
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-30 pointer-events-none">
              <ChevronLeft size={32} className="text-white drop-shadow-lg" />
            </div>
          )}
          
          {/* Right swipe indicator */}
          {currentIndex < memes.length - 1 && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-30 pointer-events-none">
              <ChevronRight size={32} className="text-white drop-shadow-lg" />
            </div>
          )}

          {/* Top info */}
          <div className="absolute top-4 left-4 right-16 pointer-events-auto">
            <div className="flex items-center space-x-3">
              <Link href={`/profile/${currentMeme.author.username}`} className="flex items-center space-x-2">
                {currentMeme.author.avatar ? (
                  <Image
                    src={currentMeme.author.avatar}
                    alt={currentMeme.author.displayName || currentMeme.author.username}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white"
                  />
                ) : (
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white">
                    <User size={20} />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white text-sm drop-shadow-lg">
                    {currentMeme.author.displayName || currentMeme.author.username}
                  </p>
                  <p className="text-xs text-gray-300 drop-shadow-lg">
                    @{currentMeme.author.username}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-4 left-4 right-20 pointer-events-auto">
            <div className="space-y-3">
              <Link href={`/meme/${currentMeme.id}`}>
                <h3 className="text-white font-semibold text-lg drop-shadow-lg hover:text-gray-200 transition-colors cursor-pointer">
                  {currentMeme.title}
                </h3>
              </Link>
              {currentMeme.description && (
                <p className="text-white text-sm drop-shadow-lg line-clamp-2">
                  {currentMeme.description}
                </p>
              )}
              
              {/* Tags */}
              {currentMeme.tags && currentMeme.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {currentMeme.tags.slice(0, 3).map((tagRelation) => (
                    <Link
                      key={tagRelation.tag.id}
                      href={`/tag/${tagRelation.tag.name}`}
                      className="inline-block bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full hover:bg-opacity-70 transition-colors"
                    >
                      #{tagRelation.tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Single comment overlay - always visible */}
          {comments.length > 0 && (
            <div className="absolute bottom-24 left-4 pointer-events-none">
              {(() => {
                const comment = comments[0]
                const commentAuthor = comment.author || comment.user
                if (!commentAuthor) return null
                
                return (
                  <div className="inline-flex items-center space-x-2 bg-black bg-opacity-20 rounded-full px-3 py-2 backdrop-blur-sm max-w-xs">
                    <div className="flex-shrink-0">
                      {commentAuthor.avatar ? (
                        <Image
                          src={commentAuthor.avatar}
                          alt={commentAuthor.displayName || commentAuthor.username}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                          {(commentAuthor.displayName || commentAuthor.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs truncate">
                        <span className="font-medium">
                          {commentAuthor.displayName || commentAuthor.username}
                        </span>{' '}
                        <span className="opacity-80">
                          {comment.content}
                        </span>
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Right side actions */}
          <div className="absolute right-4 bottom-4 pointer-events-auto">
            <div className="flex flex-col space-y-4">
              {/* Upvote */}
              <div className="flex flex-col items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVote('UPVOTE')
                  }}
                  disabled={!isAuthenticated}
                  className={`p-2 rounded-full transition-all ${
                    userVotes[currentMeme.id] === 'UPVOTE'
                      ? 'bg-red-500 text-white'
                      : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                  } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart 
                    size={20} 
                    fill={userVotes[currentMeme.id] === 'UPVOTE' ? 'currentColor' : 'none'} 
                  />
                </button>
                <span className="text-white text-xs mt-1 drop-shadow-lg">
                  {currentMeme.upvotes - currentMeme.downvotes}
                </span>
              </div>

              {/* Comments */}
              <div className="flex flex-col items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isAuthenticated) {
                      setShowComments(!showComments)
                    } else {
                      showError('Please sign in to comment')
                    }
                  }}
                  className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                >
                  <MessageCircle size={20} />
                </button>
                <span className="text-white text-xs mt-1 drop-shadow-lg">
                  {currentMeme._count?.comments || 0}
                </span>
              </div>

              {/* Favorite */}
              {isAuthenticated && (
                <div className="flex flex-col items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFavorite()
                    }}
                    className={`p-2 rounded-full transition-all ${
                      favorites[currentMeme.id]
                        ? 'bg-yellow-500 text-white'
                        : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                    }`}
                  >
                    <Bookmark 
                      size={20} 
                      fill={favorites[currentMeme.id] ? 'currentColor' : 'none'} 
                    />
                  </button>
                </div>
              )}

              {/* Share */}
              <div className="flex flex-col items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShare()
                  }}
                  className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                >
                  <Share size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments overlay with input */}
      {showComments && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-end z-40">
          <div className="w-full max-h-2/3 bg-white rounded-t-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Comment input */}
            {isAuthenticated && (
              <form onSubmit={handleCommentSubmit} className="p-4 border-b border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={isSubmittingComment}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            )}
            
            {/* Comments list */}
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {comments.length > 0 ? (
                comments.map((comment) => {
                  const commentAuthor = comment.author || comment.user
                  if (!commentAuthor) return null
                  
                  return (
                    <div key={comment.id} className="flex space-x-2">
                      <div className="flex-shrink-0">
                        {commentAuthor.avatar ? (
                          <Image
                            src={commentAuthor.avatar}
                            alt={commentAuthor.displayName || commentAuthor.username}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                            {(commentAuthor.displayName || commentAuthor.username).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {commentAuthor.displayName || commentAuthor.username}
                          </span>{' '}
                          {comment.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                }).filter(Boolean)
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {isAuthenticated ? 'No comments yet. Be the first to comment!' : 'No comments yet'}
                </p>
              )}
            </div>
            
            {!isAuthenticated && (
              <div className="p-4 bg-gray-50 text-center">
                <p className="text-gray-600 text-sm mb-2">Sign in to leave a comment</p>
                <Link
                  href="/auth/signin"
                  className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress indicator - horizontal layout */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {memes.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, relativeIndex) => {
          const actualIndex = Math.max(0, currentIndex - 2) + relativeIndex
          return (
            <div
              key={actualIndex}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                actualIndex === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white bg-opacity-40 scale-100'
              }`}
            />
          )
        })}
        {currentIndex < memes.length - 3 && (
          <div className="w-1 h-1 rounded-full bg-white bg-opacity-20" />
        )}
      </div>
    </div>
  )
}