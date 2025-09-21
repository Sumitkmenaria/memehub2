'use client'

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { MemeEditor } from '@/components/ui/meme-editor'

// Separate component that uses useSearchParams
function EditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [templateData, setTemplateData] = useState<any>(null)
  const [initialImage, setInitialImage] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get parameters from URL
    const templateId = searchParams.get('template')
    const imageUrl = searchParams.get('image')
    const title = searchParams.get('title')
    const width = searchParams.get('width')
    const height = searchParams.get('height')
    const boxCount = searchParams.get('boxCount')

    if (templateId) {
      // Template editing mode
      setTemplateData({
        id: templateId,
        title: title || 'Meme Template',
        width: width ? parseInt(width) : 500,
        height: height ? parseInt(height) : 400,
        boxCount: boxCount ? parseInt(boxCount) : 2
      })
    }

    if (imageUrl) {
      setInitialImage(decodeURIComponent(imageUrl))
    }

    setLoading(false)
  }, [searchParams])

  const handleClose = () => {
    router.back()
  }

  const handleSave = (memeData: any) => {
    // Redirect will be handled by the editor component
    console.log('Meme saved:', memeData)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)]">
        <MemeEditor
          initialImage={initialImage}
          templateData={templateData}
          onClose={handleClose}
          onSave={handleSave}
        />
      </div>
    </AppLayout>
  )
}

// Loading component for Suspense fallback
function EditorLoading() {
  return (
    <AppLayout>
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    </AppLayout>
  )
}

// Main page component with Suspense wrapper
export default function EditorPage() {
  return (
    <Suspense fallback={<EditorLoading />}>
      <EditorContent />
    </Suspense>
  )
}