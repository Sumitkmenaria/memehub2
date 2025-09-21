'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/notification-system'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    displayName?: string
    avatar?: string
  }
}

interface CommentsProps {
  memeId: string
}

export function Comments({ memeId }: CommentsProps) {
  const { data: session, status } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [deletingComments, setDeletingComments] = useState<Set<string>>(new Set())

  const isAuthenticated = status === 'authenticated' && session?.user

  const fetchComments = async (pageNum = 1, reset = false) => {
    try {
      const response = await fetch(`/api/memes/${memeId}/comments?page=${pageNum}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        if (reset) {
          setComments(data.comments)
        } else {
          setComments(prev => [...prev, ...data.comments])
        }
        setHasMore(data.pagination.hasNext)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments(1, true)
  }, [memeId])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated || !newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/memes/${memeId}/comments`, {
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
        showSuccess('Comment posted', 'Your comment has been posted successfully')
      } else {
        showError('Post failed', 'Failed to post comment. Please try again.')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated || deletingComments.has(commentId)) return

    if (!confirm('Are you sure you want to delete this comment?')) return

    setDeletingComments(prev => new Set(prev).add(commentId))
    try {
      const response = await fetch(`/api/memes/${memeId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId))
        showSuccess('Comment deleted', 'Your comment has been deleted')
      } else {
        showError('Delete failed', 'Failed to delete comment. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setDeletingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    }
  }

  const loadMoreComments = () => {
    if (!loading && hasMore) {
      fetchComments(page + 1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <MessageCircle size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex space-x-3">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                  <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">Sign in to leave a comment</p>
          <Link
            href="/auth/signin"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Link href={`/profile/${comment.user.username}`}>
                  {comment.user.avatar ? (
                    <Image
                      src={comment.user.avatar}
                      alt={comment.user.displayName || comment.user.username}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {(comment.user.displayName || comment.user.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Link 
                          href={`/profile/${comment.user.username}`}
                          className="font-medium text-sm text-gray-900 hover:text-indigo-600"
                        >
                          {comment.user.displayName || comment.user.username}
                        </Link>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Delete button for comment owner */}
                      {isAuthenticated && session.user.email && comment.user.id === session.user.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingComments.has(comment.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete comment"
                        >
                          {deletingComments.has(comment.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMoreComments}
                  disabled={loading}
                  className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more comments'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}