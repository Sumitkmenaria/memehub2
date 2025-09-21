'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { AppLayout } from '@/components/layout/app-layout'
import { MemeCard } from '@/components/ui/meme-card'
import { Calendar, Users, Heart, MessageCircle, UserPlus, UserMinus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface UserProfile {
  id: string
  username: string
  displayName?: string
  avatar?: string
  bio?: string
  createdAt: string
  _count: {
    memes: number
    followers: number
    following: number
  }
}

interface ProfileMeme {
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

interface ProfileData {
  user: UserProfile
  memes: ProfileMeme[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
  }
}

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const isAuthenticated = status === 'authenticated' && session?.user
  const isOwnProfile = isAuthenticated && session.user.username === resolvedParams.username

  const fetchProfileData = async (currentPage: number, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(
        `/api/users/${resolvedParams.username}?page=${currentPage}&limit=12`
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found')
        }
        throw new Error('Failed to fetch profile')
      }

      const data: ProfileData = await response.json()
      
      if (reset) {
        setProfileData(data)
      } else {
        setProfileData(prev => {
          if (!prev) return data
          return {
            ...data,
            memes: [...prev.memes, ...data.memes],
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const checkFollowStatus = async () => {
    if (!isAuthenticated || isOwnProfile || !profileData?.user.id) return

    try {
      const response = await fetch(
        `/api/users/follow?targetUserId=${profileData.user.id}`
      )
      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.following)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollow = async () => {
    if (!isAuthenticated || !profileData?.user.id) return

    setFollowLoading(true)
    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: profileData.user.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.following)
        
        // Update follower count locally
        setProfileData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            user: {
              ...prev.user,
              _count: {
                ...prev.user._count,
                followers: prev.user._count.followers + (data.following ? 1 : -1),
              },
            },
          }
        })
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileData(1, true)
  }, [resolvedParams.username])

  useEffect(() => {
    if (profileData) {
      checkFollowStatus()
    }
  }, [profileData, isAuthenticated])

  const loadMore = () => {
    if (!loadingMore && profileData?.pagination.hasNext) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchProfileData(nextPage)
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
        // Refresh profile data to reflect new scores
        fetchProfileData(1, true)
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
      setProfileData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          memes: prev.memes.map(meme => 
            meme.id === memeId 
              ? { ...meme, shareCount: meme.shareCount + 1 }
              : meme
          ),
        }
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleDelete = async (memeId: string) => {
    // Remove the meme from the profile data
    setProfileData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        memes: prev.memes.filter(meme => meme.id !== memeId),
        user: {
          ...prev.user,
          _count: {
            ...prev.user._count,
            memes: prev.user._count.memes - 1,
          },
        },
      }
    })
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

  if (error || !profileData) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error === 'User not found' ? 'User Not Found' : 'Error Loading Profile'}
          </h3>
          <p className="text-gray-600 mb-4">
            {error === 'User not found' 
              ? 'This user does not exist or has been removed.'
              : error || 'Something went wrong while loading this profile.'}
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

  const { user, memes, pagination } = profileData

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.displayName || user.username}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              ) : (
                <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 truncate">
                    {user.displayName || user.username}
                  </h1>
                  <p className="text-gray-600">@{user.username}</p>
                </div>
                
                {/* Follow Button */}
                {!isOwnProfile && isAuthenticated && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {followLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : isFollowing ? (
                      <UserMinus size={16} />
                    ) : (
                      <UserPlus size={16} />
                    )}
                    <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                  </button>
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-gray-700 mb-3">{user.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Heart size={16} />
                  <span>{user._count.memes} memes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users size={16} />
                  <span>{user._count.followers} followers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users size={16} />
                  <span>{user._count.following} following</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Memes */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isOwnProfile ? 'Your Memes' : `${user.displayName || user.username}'s Memes`}
            <span className="text-gray-500 font-normal ml-2">({user._count.memes})</span>
          </h2>

          {memes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isOwnProfile ? 'No Memes Yet' : 'No Memes'}
              </h3>
              <p className="text-gray-600">
                {isOwnProfile 
                  ? 'Start sharing memes to build your collection!'
                  : 'This user hasn\'t shared any memes yet.'}
              </p>
              {isOwnProfile && (
                <Link
                  href="/upload"
                  className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Upload Your First Meme
                </Link>
              )}
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
                  onDelete={handleDelete}
                />
              ))}

              {/* Load More Button */}
              {pagination.hasNext && (
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
      </div>
    </AppLayout>
  )
}