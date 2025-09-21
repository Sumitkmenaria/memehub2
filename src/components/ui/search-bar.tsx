'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MemeCard } from '@/components/ui/meme-card'
import { useSession } from 'next-auth/react'

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

interface SearchBarProps {
  placeholder?: string
  onResults?: (results: Meme[]) => void
  showResults?: boolean
  className?: string
}

export function SearchBar({ 
  placeholder = "Search memes...", 
  onResults, 
  showResults = true,
  className = ""
}: SearchBarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Meme[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [hasSearched, setHasSearched] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const isAuthenticated = session?.user

  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    
    try {
      const response = await fetch(`/api/memes/search?q=${encodeURIComponent(searchQuery)}&limit=20`)
      
      if (response.ok) {
        const data = await response.json()
        setResults(data.memes)
        onResults?.(data.memes)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query) {
        performSearch(query)
        setShowDropdown(true)
      } else {
        setResults([])
        setShowDropdown(false)
        setHasSearched(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          router.push(`/meme/${results[selectedIndex].id}`)
          setShowDropdown(false)
          inputRef.current?.blur()
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Vote handler
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
        setResults(prev => prev.map(meme => 
          meme.id === memeId 
            ? { ...meme, upvotes: data.upvotes, downvotes: data.downvotes }
            : meme
        ))
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  // Favorite handler
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

  // Share handler
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
        setResults(prev => prev.map(meme => 
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
    setResults(prev => prev.filter(meme => meme.id !== memeId))
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setShowDropdown(false)
              setHasSearched(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader className="animate-spin text-indigo-500" size={20} />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader className="animate-spin mx-auto mb-2 text-indigo-500" size={24} />
              <p className="text-gray-600">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-2 text-sm text-gray-500 border-b">
                Found {results.length} results for "{query}"
              </div>
              {results.slice(0, 5).map((meme, index) => (
                <div
                  key={meme.id}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    selectedIndex === index ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    router.push(`/meme/${meme.id}`)
                    setShowDropdown(false)
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={meme.imageUrl}
                      alt={meme.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {meme.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {meme.author.displayName || meme.author.username}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {results.length > 5 && (
                <div className="px-3 py-2 text-center border-t">
                  <button
                    onClick={() => {
                      // Navigate to full search results page
                      router.push(`/search?q=${encodeURIComponent(query)}`)
                      setShowDropdown(false)
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    View all {results.length} results
                  </button>
                </div>
              )}
            </div>
          ) : hasSearched ? (
            <div className="p-4 text-center">
              <p className="text-gray-600">No results found for "{query}"</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Full Results Display */}
      {!showResults && results.length > 0 && (
        <div className="mt-6 space-y-6">
          <div className="text-sm text-gray-600">
            Found {results.length} results for "{query}"
          </div>
          {results.map((meme) => (
            <MemeCard
              key={meme.id}
              meme={meme}
              onVote={handleVote}
              onFavorite={handleFavorite}
              onShare={handleShare}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}