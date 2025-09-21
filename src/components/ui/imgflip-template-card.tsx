'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit3, Palette } from 'lucide-react'

interface ImgflipTemplateCardProps {
  template: {
    id: string
    title: string
    description?: string
    imageUrl: string
    imgflip?: {
      templateId: string
      width: number
      height: number
      boxCount: number
    }
  }
  onClick?: () => void
}

export function ImgflipTemplateCard({ template, onClick }: ImgflipTemplateCardProps) {
  const router = useRouter()

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    const params = new URLSearchParams({
      template: template.imgflip?.templateId || template.id,
      image: encodeURIComponent(template.imageUrl),
      title: template.title,
      width: (template.imgflip?.width || 600).toString(),
      height: (template.imgflip?.height || 400).toString(),
      boxCount: (template.imgflip?.boxCount || 2).toString()
    })
    router.push(`/editor?${params.toString()}`)
  }

  const handleCardClick = () => {
    onClick?.()
  }
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer group relative"
      onClick={handleCardClick}
    >
      {/* Edit Button Overlay */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button
          onClick={handleEdit}
          className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors shadow-lg"
        >
          <Edit3 size={16} />
          <span>Edit Meme</span>
        </button>
      </div>
      {/* Template Image */}
      <div className="relative bg-gray-100">
        <Image
          src={template.imageUrl}
          alt={template.title}
          width={template.imgflip?.width || 600}
          height={template.imgflip?.height || 400}
          className="w-full max-h-96 object-contain"
          priority={false}
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Template Info Overlay */}
        {template.imgflip?.boxCount && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md">
            {template.imgflip.boxCount} text box{template.imgflip.boxCount !== 1 ? 'es' : ''}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 text-lg hover:text-indigo-600 transition-colors">
          {template.title}
        </h3>
        
        {template.description && (
          <p className="text-gray-600 text-sm leading-relaxed">
            {template.description}
          </p>
        )}

        {/* Template Metadata */}
        {template.imgflip && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>Template ID: {template.imgflip.templateId}</span>
            <span>{template.imgflip.width} × {template.imgflip.height}</span>
          </div>
        )}
      </div>
    </div>
  )
}