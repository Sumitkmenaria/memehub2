'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchResult {
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
  imgflip?: {
    templateId: string
    width: number
    height: number
    boxCount: number
  }
  source?: 'local' | 'imgflip'
}

interface DiscoverSearchBarProps {
  placeholder?: string
  onResults?: (results: SearchResult[]) => void
  showResults?: boolean
  className?: string
}

export function DiscoverSearchBar({ 
  placeholder = "Search memes and templates...", 
  onResults, 
  showResults = true,
  className = ""
}: DiscoverSearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [hasSearched, setHasSearched] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Search function for combined memes and templates
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      onResults?.([])
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    
    try {
      const response = await fetch(`/api/discover/search?q=${encodeURIComponent(searchQuery)}&limit=20`)
      
      if (response.ok) {
        const data = await response.json()
        setResults(data.memes)
        onResults?.(data.memes)
      } else {
        setResults([])
        onResults?.([])
      }
    } catch (error) {
      console.error('Discover search error:', error)
      setResults([])
      onResults?.([])
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
        onResults?.([])
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
          const selectedResult = results[selectedIndex]
          if (selectedResult.source === 'imgflip') {
            // For Imgflip templates, we might want to open the editor or show template details
            console.log('Selected Imgflip template:', selectedResult)
          } else {
            // For local memes, navigate to meme detail page
            router.push(`/meme/${selectedResult.id}`)
          }
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

  const handleResultClick = (result: SearchResult) => {
    if (result.source === 'imgflip') {
      // For Imgflip templates, we might want to open the editor or show template details
      console.log('Clicked Imgflip template:', result)
    } else {
      // For local memes, navigate to meme detail page
      router.push(`/meme/${result.id}`)
    }
    setShowDropdown(false)
  }

  const getResultIcon = (result: SearchResult) => {
    if (result.source === 'imgflip') {
      return '🎨' // Template icon
    }
    return '🎭' // Regular meme icon
  }

  const getResultSubtext = (result: SearchResult) => {
    if (result.source === 'imgflip') {
      return `Template • ${result.imgflip?.boxCount || 0} text boxes`
    }
    return `by ${result.author.displayName || result.author.username}`
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
              onResults?.([])
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
              <p className="text-gray-600">Searching memes and templates...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-2 text-sm text-gray-500 border-b">
                Found {results.length} results for "{query}"
              </div>
              {results.slice(0, 8).map((result, index) => (
                <div
                  key={result.id}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    selectedIndex === index ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={result.imageUrl}
                      alt={result.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getResultIcon(result)}</span>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {getResultSubtext(result)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="p-4 text-center">
              <p className="text-gray-600">No templates or memes found for "{query}"</p>
              <p className="text-xs text-gray-500 mt-1">Try different keywords or browse popular templates</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}