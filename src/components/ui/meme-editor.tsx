'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Upload, Download, Share2, Type, Move, RotateCcw, Save, X, Plus, Minus } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { showSuccess, showError } from '@/components/ui/notification-system'

interface MemeText {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  strokeColor: string
  strokeWidth: number
  fontFamily: string
  textAlign: 'left' | 'center' | 'right'
  fontWeight: 'normal' | 'bold'
  textTransform: 'none' | 'uppercase' | 'lowercase'
}

interface MemeEditorProps {
  initialImage?: string
  templateData?: {
    id: string
    title: string
    width: number
    height: number
    boxCount?: number
  }
  onClose?: () => void
  onSave?: (memeData: any) => void
}

export function MemeEditor({ initialImage, templateData, onClose, onSave }: MemeEditorProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>(initialImage || '')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 400 })
  const [originalImageSize, setOriginalImageSize] = useState({ width: 500, height: 400 })
  
  // Text management
  const [memeTexts, setMemeTexts] = useState<MemeText[]>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [isAddingText, setIsAddingText] = useState(false)
  
  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  
  const isAuthenticated = status === 'authenticated' && session?.user

  // Initialize with template data or default texts
  useEffect(() => {
    if (templateData && templateData.boxCount && templateData.boxCount > 0) {
      const initialTexts: MemeText[] = []
      
      // Create default text boxes based on box count
      for (let i = 0; i < Math.min(templateData.boxCount, 4); i++) {
        const isTop = i % 2 === 0
        initialTexts.push({
          id: `text_${i}`,
          text: isTop ? 'TOP TEXT' : 'BOTTOM TEXT',
          x: 50,
          y: isTop ? 10 : 80,
          fontSize: 36,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 3,
          fontFamily: 'Impact, Arial Black, sans-serif',
          textAlign: 'center',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        })
      }
      
      setMemeTexts(initialTexts)
      if (initialTexts.length > 0) {
        setSelectedTextId(initialTexts[0].id)
      }
    } else {
      // Default top and bottom text
      const defaultTexts: MemeText[] = [
        {
          id: 'top_text',
          text: 'TOP TEXT',
          x: 50,
          y: 10,
          fontSize: 36,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 3,
          fontFamily: 'Impact, Arial Black, sans-serif',
          textAlign: 'center',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        },
        {
          id: 'bottom_text',
          text: 'BOTTOM TEXT',
          x: 50,
          y: 80,
          fontSize: 36,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 3,
          fontFamily: 'Impact, Arial Black, sans-serif',
          textAlign: 'center',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }
      ]
      setMemeTexts(defaultTexts)
      setSelectedTextId(defaultTexts[0].id)
    }
  }, [templateData])

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setImageFile(file)
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setImageLoaded(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  // Image loading handler
  const handleImageLoad = (img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const maxWidth = 800
    const maxHeight = 600
    let { width, height } = img

    // Scale image to fit in editor while maintaining aspect ratio
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width *= ratio
      height *= ratio
    }

    setOriginalImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    setCanvasSize({ width, height })
    setImageLoaded(true)
  }

  // Canvas drawing
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageUrl || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // Draw text overlays
      memeTexts.forEach(textObj => {
        const x = (textObj.x / 100) * canvas.width
        const y = (textObj.y / 100) * canvas.height
        
        ctx.font = `${textObj.fontWeight} ${textObj.fontSize}px ${textObj.fontFamily}`
        ctx.textAlign = textObj.textAlign
        ctx.textBaseline = 'middle'
        
        const text = textObj.textTransform === 'uppercase' ? textObj.text.toUpperCase() :
                    textObj.textTransform === 'lowercase' ? textObj.text.toLowerCase() :
                    textObj.text
        
        // Draw stroke
        if (textObj.strokeWidth > 0) {
          ctx.strokeStyle = textObj.strokeColor
          ctx.lineWidth = textObj.strokeWidth
          ctx.strokeText(text, x, y)
        }
        
        // Draw fill
        ctx.fillStyle = textObj.color
        ctx.fillText(text, x, y)
        
        // Draw selection indicator
        if (textObj.id === selectedTextId) {
          ctx.strokeStyle = '#3B82F6'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          const metrics = ctx.measureText(text)
          const textWidth = metrics.width
          const textHeight = textObj.fontSize
          
          // Calculate selection bounds based on text alignment
          let selectionX = x
          if (textObj.textAlign === 'center') {
            selectionX = x - textWidth / 2
          } else if (textObj.textAlign === 'right') {
            selectionX = x - textWidth
          }
          
          ctx.strokeRect(
            selectionX - 10, 
            y - textHeight/2 - 10, 
            textWidth + 20, 
            textHeight + 20
          )
          
          // Add corner handles for visual feedback
          ctx.setLineDash([])
          ctx.fillStyle = '#3B82F6'
          const handleSize = 6
          const handles = [
            [selectionX - 10, y - textHeight/2 - 10], // top-left
            [selectionX + textWidth + 10, y - textHeight/2 - 10], // top-right
            [selectionX - 10, y + textHeight/2 + 10], // bottom-left
            [selectionX + textWidth + 10, y + textHeight/2 + 10] // bottom-right
          ]
          
          handles.forEach(([hx, hy]) => {
            ctx.fillRect(hx - handleSize/2, hy - handleSize/2, handleSize, handleSize)
          })
        }
      })
    }
    img.src = imageUrl
  }, [imageUrl, imageLoaded, memeTexts, selectedTextId])

  // Redraw canvas when dependencies change
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Text management functions
  const addText = () => {
    const newText: MemeText = {
      id: `text_${Date.now()}`,
      text: 'NEW TEXT',
      x: 50,
      y: 50,
      fontSize: 36,
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 3,
      fontFamily: 'Impact, Arial Black, sans-serif',
      textAlign: 'center',
      fontWeight: 'bold',
      textTransform: 'uppercase'
    }
    setMemeTexts([...memeTexts, newText])
    setSelectedTextId(newText.id)
  }

  const removeText = (textId: string) => {
    setMemeTexts(memeTexts.filter(text => text.id !== textId))
    if (selectedTextId === textId) {
      setSelectedTextId(memeTexts.length > 1 ? memeTexts[0].id : null)
    }
  }

  const updateText = (textId: string, updates: Partial<MemeText>) => {
    setMemeTexts(memeTexts.map(text => 
      text.id === textId ? { ...text, ...updates } : text
    ))
  }

  const selectedText = memeTexts.find(text => text.id === selectedTextId)

  // Helper function to check if a point is within text bounds
  const isPointInText = (x: number, y: number, textObj: MemeText, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    const textX = (textObj.x / 100) * canvas.width
    const textY = (textObj.y / 100) * canvas.height
    
    ctx.font = `${textObj.fontWeight} ${textObj.fontSize}px ${textObj.fontFamily}`
    ctx.textAlign = textObj.textAlign
    
    const text = textObj.textTransform === 'uppercase' ? textObj.text.toUpperCase() :
                textObj.textTransform === 'lowercase' ? textObj.text.toLowerCase() :
                textObj.text
    
    const metrics = ctx.measureText(text)
    const textWidth = metrics.width
    const textHeight = textObj.fontSize
    
    // Calculate text bounds based on alignment
    let boundsX = textX
    if (textObj.textAlign === 'center') {
      boundsX = textX - textWidth / 2
    } else if (textObj.textAlign === 'right') {
      boundsX = textX - textWidth
    }
    
    const boundsY = textY - textHeight / 2
    
    // Add padding for easier clicking
    const padding = 10
    return x >= boundsX - padding && 
           x <= boundsX + textWidth + padding && 
           y >= boundsY - padding && 
           y <= boundsY + textHeight + padding
  }

  // Canvas click handler for text selection/positioning
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const x = (clickX / canvas.clientWidth) * 100
    const y = (clickY / canvas.clientHeight) * 100

    if (isAddingText) {
      addText()
      setIsAddingText(false)
      return
    }

    // Check if click is on any text
    let clickedTextId: string | null = null
    for (let i = memeTexts.length - 1; i >= 0; i--) {
      const textObj = memeTexts[i]
      if (isPointInText(clickX, clickY, textObj, canvas)) {
        clickedTextId = textObj.id
        break
      }
    }

    if (clickedTextId) {
      setSelectedTextId(clickedTextId)
    } else if (selectedTextId) {
      // Move selected text to clicked position
      updateText(selectedTextId, { x, y })
    }
  }

  // Canvas mouse move handler for cursor styling
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Check if mouse is over any text
    let isOverText = false
    for (const textObj of memeTexts) {
      if (isPointInText(clickX, clickY, textObj, canvas)) {
        isOverText = true
        break
      }
    }

    // Update cursor style
    canvas.style.cursor = isOverText ? 'pointer' : 'crosshair'
  }
  const generateMeme = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject('Canvas context not available')

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // Use original image dimensions for final output
        canvas.width = originalImageSize.width
        canvas.height = originalImageSize.height
        
        // Draw image at full resolution
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Draw text overlays at full resolution
        memeTexts.forEach(textObj => {
          const x = (textObj.x / 100) * canvas.width
          const y = (textObj.y / 100) * canvas.height
          const fontSize = (textObj.fontSize / canvasSize.width) * canvas.width
          
          ctx.font = `${textObj.fontWeight} ${fontSize}px ${textObj.fontFamily}`
          ctx.textAlign = textObj.textAlign
          ctx.textBaseline = 'middle'
          
          const text = textObj.textTransform === 'uppercase' ? textObj.text.toUpperCase() :
                      textObj.textTransform === 'lowercase' ? textObj.text.toLowerCase() :
                      textObj.text
          
          // Draw stroke
          if (textObj.strokeWidth > 0) {
            ctx.strokeStyle = textObj.strokeColor
            ctx.lineWidth = (textObj.strokeWidth / canvasSize.width) * canvas.width
            ctx.strokeText(text, x, y)
          }
          
          // Draw fill
          ctx.fillStyle = textObj.color
          ctx.fillText(text, x, y)
        })
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject('Failed to generate image')
          }
        }, 'image/png')
      }
      img.onerror = () => reject('Failed to load image')
      img.src = imageUrl
    })
  }

  // Download meme
  const downloadMeme = async () => {
    try {
      const blob = await generateMeme()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meme_${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccess('Download started', 'Your meme has been downloaded!')
    } catch (error) {
      showError('Download failed', 'Failed to download meme')
    }
  }

  // Save and publish meme
  const saveMeme = async () => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    if (!title.trim()) {
      showError('Title required', 'Please enter a title for your meme')
      return
    }

    setIsUploading(true)

    try {
      const blob = await generateMeme()
      const formData = new FormData()
      
      formData.append('file', blob, `meme_${Date.now()}.png`)
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('memeType', 'IMAGE')
      
      const tagList = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 10)
      
      formData.append('tags', JSON.stringify(tagList))

      const response = await fetch('/api/memes/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        showSuccess('Meme published!', 'Your meme has been published successfully!')
        
        setTimeout(() => {
          onSave?.(data.meme)
          onClose?.()
          router.push(`/meme/${data.meme.id}`)
        }, 1500)
      } else {
        const errorData = await response.json()
        showError('Upload failed', errorData.error || 'Failed to publish meme')
      }
    } catch (error) {
      showError('Upload error', 'Something went wrong while publishing your meme')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-screen bg-gray-50">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Meme Editor</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadMeme}
              disabled={!imageLoaded}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          {!imageUrl ? (
            <div className="w-full max-w-md">
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
                  {isDragActive ? 'Drop your image here!' : 'Upload an image to start'}
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF, or WEBP (max 10MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                className="border border-gray-300 rounded-lg cursor-crosshair bg-white shadow-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              {imageUrl && !imageLoaded && (
                <img
                  src={imageUrl}
                  alt="Meme"
                  onLoad={(e) => handleImageLoad(e.target as HTMLImageElement)}
                  className="hidden"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Controls */}
      <div className="w-full lg:w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Text Controls</h2>
          
          {/* Add Text Button */}
          <button
            onClick={addText}
            disabled={!imageLoaded}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 mb-4"
          >
            <Plus size={16} />
            <span>Add Text</span>
          </button>

          {/* Text List */}
          <div className="space-y-2 mb-4">
            {memeTexts.map((text, index) => (
              <div
                key={text.id}
                className={`p-3 border rounded cursor-pointer transition-all duration-200 ${
                  selectedTextId === text.id 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-200' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTextId(text.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate block ${
                      selectedTextId === text.id ? 'text-indigo-700' : 'text-gray-700'
                    }`}>
                      {text.text || `Text ${index + 1}`}
                    </span>
                    {selectedTextId === text.id && (
                      <span className="text-xs text-indigo-500 mt-1 block">
                        Selected - Click on canvas to move
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeText(text.id)
                    }}
                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Text Properties */}
        {selectedText && (
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Edit Selected Text</h3>
            
            {/* Text Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
              <textarea
                value={selectedText.text}
                onChange={(e) => updateText(selectedText.id, { text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>

            {/* Font Size */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size: {selectedText.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="72"
                value={selectedText.fontSize}
                onChange={(e) => updateText(selectedText.id, { fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Text Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <input
                type="color"
                value={selectedText.color}
                onChange={(e) => updateText(selectedText.id, { color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>

            {/* Stroke Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stroke Color</label>
              <input
                type="color"
                value={selectedText.strokeColor}
                onChange={(e) => updateText(selectedText.id, { strokeColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>

            {/* Stroke Width */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stroke Width: {selectedText.strokeWidth}px
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={selectedText.strokeWidth}
                onChange={(e) => updateText(selectedText.id, { strokeWidth: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Text Align */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Align</label>
              <select
                value={selectedText.textAlign}
                onChange={(e) => updateText(selectedText.id, { textAlign: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>

            {/* Font Weight */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedText.fontWeight === 'bold'}
                  onChange={(e) => updateText(selectedText.id, { fontWeight: e.target.checked ? 'bold' : 'normal' })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Bold</span>
              </label>
            </div>

            {/* Text Transform */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Transform</label>
              <select
                value={selectedText.textTransform}
                onChange={(e) => updateText(selectedText.id, { textTransform: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="none">None</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
              </select>
            </div>

            {/* Position */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position (X: {selectedText.x.toFixed(0)}%, Y: {selectedText.y.toFixed(0)}%)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">X Position</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedText.x}
                    onChange={(e) => updateText(selectedText.id, { x: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Y Position</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedText.y}
                    onChange={(e) => updateText(selectedText.id, { y: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Publish Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Publish Meme</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter meme title..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="funny, meme, viral (comma separated)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={saveMeme}
              disabled={isUploading || !imageLoaded || !title.trim()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              <span>{isUploading ? 'Publishing...' : 'Publish Meme'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}