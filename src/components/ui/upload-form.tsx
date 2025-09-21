'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Upload, X, Image as ImageIcon, Video, FileText, Edit3, Send } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/notification-system'
import { MemeEditor } from '@/components/ui/meme-editor'

interface UploadFormProps {
  onClose?: () => void
  onSuccess?: (memeId: string) => void
}

export function UploadForm({ onClose, onSuccess }: UploadFormProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [showActionChoice, setShowActionChoice] = useState(false)

  // Check if user is actually authenticated
  const isAuthenticated = status === 'authenticated' && session?.user

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError('')
      setShowActionChoice(true) // Show action choices after upload
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  })

  const removeFile = () => {
    setUploadedFile(null)
    setPreviewUrl('')
    setShowActionChoice(false)
    setShowEditor(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }

  const getMemeType = (file: File): 'IMAGE' | 'GIF' | 'VIDEO' => {
    if (file.type.startsWith('video/')) return 'VIDEO'
    if (file.type === 'image/gif') return 'GIF'
    return 'IMAGE'
  }

  const handleEditInEditor = () => {
    setShowEditor(true)
  }

  const handleBackFromEditor = () => {
    setShowEditor(false)
  }

  const handleDirectPublish = () => {
    setShowActionChoice(false)
    // Show the publish form
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      setError('You must be logged in to upload memes')
      return
    }

    if (!uploadedFile) {
      setError('Please select a file to upload')
      return
    }

    if (!title.trim()) {
      setError('Please enter a title for your meme')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('memeType', getMemeType(uploadedFile))
      
      // Process tags
      const tagList = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 10) // Limit to 10 tags
      
      formData.append('tags', JSON.stringify(tagList))

      const response = await fetch('/api/memes/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSuccessMessage('Meme uploaded successfully! Redirecting...')
        setError('')
        
        setTimeout(() => {
          onSuccess?.(data.meme.id)
          onClose?.()
          // Redirect to the newly created meme page
          router.push(`/meme/${data.meme.id}`)
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to upload meme')
        showError('Upload failed', errorData.error || 'Failed to upload meme')
      }
    } catch (error) {
      const errorMessage = 'Something went wrong while uploading'
      setError(errorMessage)
      showError('Upload error', errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">You need to be logged in to upload memes</p>
        <button
          onClick={() => router.push('/auth/signin')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Sign In
        </button>
      </div>
    )
  }

  // Show meme editor if user chose to edit
  if (showEditor && uploadedFile && previewUrl) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <MemeEditor
          initialImage={previewUrl}
          onClose={handleBackFromEditor}
          onSave={(memeData) => {
            onSuccess?.(memeData.id)
            onClose?.()
          }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Upload a Meme</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image or Video
          </label>
          
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop your meme here!' : 'Choose a file or drag it here'}
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, GIF, or MP4 (max 50MB)
              </p>
            </div>
          ) : showActionChoice ? (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {uploadedFile.type.startsWith('video/') ? (
                      <Video className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {uploadedFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {/* Preview */}
                {previewUrl && (
                  <div className="mt-3">
                    {uploadedFile.type.startsWith('video/') ? (
                      <video
                        src={previewUrl}
                        controls
                        className="w-full max-h-64 object-contain bg-gray-100 rounded"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full max-h-64 object-contain bg-gray-100 rounded"
                      />
                    )}
                  </div>
                )}
              </div>
              
              {/* Action Choices */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  What would you like to do with your image?
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Edit in Meme Editor */}
                  <button
                    type="button"
                    onClick={handleEditInEditor}
                    className="flex flex-col items-center p-6 bg-white border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-200">
                      <Edit3 className="text-indigo-600" size={24} />
                    </div>
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Edit in Meme Editor</h4>
                    <p className="text-sm text-gray-600 text-center">
                      Add text, captions, and create a professional meme
                    </p>
                  </button>
                  
                  {/* Publish Directly */}
                  <button
                    type="button"
                    onClick={handleDirectPublish}
                    className="flex flex-col items-center p-6 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200">
                      <Send className="text-green-600" size={24} />
                    </div>
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Publish Directly</h4>
                    <p className="text-sm text-gray-600 text-center">
                      Upload as-is with title and description
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {uploadedFile.type.startsWith('video/') ? (
                      <Video className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {uploadedFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {/* Preview */}
                {previewUrl && (
                  <div className="mt-3">
                    {uploadedFile.type.startsWith('video/') ? (
                      <video
                        src={previewUrl}
                        controls
                        className="w-full max-h-64 object-contain bg-gray-100 rounded"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full max-h-64 object-contain bg-gray-100 rounded"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Show title, description, tags only when not showing action choices */}
        {uploadedFile && !showActionChoice && (
          <>
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your meme a catchy title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description to give context..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="funny, relatable, cats (comma separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate tags with commas. Max 10 tags.
              </p>
            </div>
          </>
        )}

        {/* Show submit section only when not showing action choices */}
        {uploadedFile && !showActionChoice && (
          <>
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowActionChoice(true)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isUploading || !uploadedFile || !title.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Upload Meme'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}