'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { ImgflipTemplateCard } from '@/components/ui/imgflip-template-card'
import { DiscoverSearchBar } from '@/components/ui/discover-search-bar'
import { Compass, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImgflipMeme {
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

export default function DiscoverPage() {
  const [memes, setMemes] = useState<ImgflipMeme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMemes, setTotalMemes] = useState(0)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<ImgflipMeme[]>([])
  const ITEMS_PER_PAGE = 12

  const handleSearchResults = (results: ImgflipMeme[]) => {
    // For discover page, we need to use the special discover search API
    // The SearchBar component will be updated to handle discover-specific search
    setSearchResults(results)
    setShowSearchResults(results.length > 0)
  }

  const performDiscoverSearch = async (searchQuery: string): Promise<ImgflipMeme[]> => {
    if (!searchQuery.trim()) return []
    
    try {
      const response = await fetch(`/api/discover/search?q=${encodeURIComponent(searchQuery)}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        return data.memes
      }
    } catch (error) {
      console.error('Discover search error:', error)
    }
    return []
  }

  const fetchMemes = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      console.log(`Fetching Imgflip memes - page ${pageNum}`)
      const response = await fetch(`/api/imgflip?page=${pageNum}&limit=${ITEMS_PER_PAGE}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch memes: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Imgflip API response:', data)
      
      setMemes(data.memes)
      setTotalMemes(data.total)
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE))
      setCurrentPage(pageNum)
    } catch (error) {
      console.error('Error fetching Imgflip memes:', error)
      setError('Failed to load meme templates. Please try again later.')
      setMemes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemes(1)
  }, [])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && !loading) {
      fetchMemes(page)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Compass className="text-indigo-500" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">
              Discover Meme Templates
            </h1>
          </div>
          <p className="text-gray-600 mb-2">
            Browse popular meme templates from Imgflip - find the perfect template for your next meme!
          </p>
          <p className="text-sm text-gray-500">
            Click on any template to learn more about it or use it as inspiration.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <DiscoverSearchBar 
            placeholder="Search memes and templates..."
            onResults={handleSearchResults}
            showResults={false}
            className="max-w-md"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchMemes(currentPage)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
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
                    Back to templates
                  </button>
                </div>
                {/* Search Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((result) => {
                    if (result.source === 'imgflip') {
                      // Render Imgflip template
                      return (
                        <ImgflipTemplateCard
                          key={result.id}
                          template={{
                            id: result.id,
                            title: result.title,
                            description: result.description,
                            imageUrl: result.imageUrl,
                            imgflip: result.imgflip
                          }}
                          onClick={() => {
                            console.log('Template clicked for info:', result.title)
                          }}
                        />
                      )
                    } else {
                      // Render regular meme
                      return (
                        <div key={result.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                          <img
                            src={result.imageUrl}
                            alt={result.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">🎭</span>
                              <h3 className="font-semibold text-gray-900 truncate flex-1">{result.title}</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              by {result.author.displayName || result.author.username}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>👍 {result.upvotes}</span>
                              <span>👁️ {result.views}</span>
                              <span>💬 {result._count?.comments || 0}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {memes.map((meme) => (
                    <ImgflipTemplateCard
                      key={meme.id}
                      template={{
                        id: meme.id,
                        title: meme.title,
                        description: meme.description,
                        imageUrl: meme.imageUrl,
                        imgflip: meme.imgflip
                      }}
                      onClick={() => {
                        console.log('Template clicked for info:', meme.title)
                        // This click handler is now for viewing template info
                        // Edit functionality is handled by the button in the card
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                          {' '}to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * ITEMS_PER_PAGE, totalMemes)}
                          </span>
                          {' '}of{' '}
                          <span className="font-medium">{totalMemes}</span> templates
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                          </button>
                          
                          {/* Page Numbers */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => 
                              page === 1 || 
                              page === totalPages || 
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            )
                            .map((page, index, array) => {
                              if (index > 0 && array[index - 1] !== page - 1) {
                                return [
                                  <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                    ...
                                  </span>,
                                  <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                                      page === currentPage
                                        ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                        : 'text-gray-900'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ]
                              }
                              return (
                                <button
                                  key={page}
                                  onClick={() => goToPage(page)}
                                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                                    page === currentPage
                                      ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            })}
                          
                          <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!loading && memes.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Compass className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Templates Found
            </h3>
            <p className="text-gray-600">
              No meme templates found.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}