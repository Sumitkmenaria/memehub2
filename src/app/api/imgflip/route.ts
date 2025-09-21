import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Fetch memes from Imgflip API
    const response = await fetch('https://api.imgflip.com/get_memes')
    
    if (!response.ok) {
      throw new Error('Failed to fetch memes from Imgflip')
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error('Imgflip API returned an error')
    }
    
    // Transform Imgflip memes to match our meme structure
    const imgflipMemes = data.data.memes
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMemes = imgflipMemes.slice(startIndex, endIndex)
    
    const transformedMemes = paginatedMemes.map((meme: any) => ({
      id: `imgflip_${meme.id}`,
      title: meme.name,
      description: `Popular meme template from Imgflip - ${meme.box_count} text boxes`,
      imageUrl: meme.url,
      memeType: 'IMAGE' as const,
      upvotes: Math.floor(Math.random() * 1000) + 100, // Simulated engagement
      downvotes: Math.floor(Math.random() * 50),
      views: Math.floor(Math.random() * 10000) + 1000,
      shareCount: Math.floor(Math.random() * 100),
      createdAt: new Date().toISOString(),
      author: {
        id: 'imgflip_user',
        username: 'imgflip',
        displayName: 'Imgflip Templates',
        avatar: 'https://imgflip.com/s/img/logo_sm.png'
      },
      tags: [
        {
          tag: {
            id: 'imgflip_tag',
            name: 'imgflip'
          }
        },
        {
          tag: {
            id: 'template_tag', 
            name: 'template'
          }
        }
      ],
      _count: {
        comments: Math.floor(Math.random() * 50)
      },
      // Additional Imgflip specific data
      imgflip: {
        templateId: meme.id,
        width: meme.width,
        height: meme.height,
        boxCount: meme.box_count
      }
    }))
    
    const hasMore = endIndex < imgflipMemes.length
    
    return NextResponse.json({
      memes: transformedMemes,
      hasMore,
      total: imgflipMemes.length,
      page,
      limit,
      source: 'imgflip'
    })

  } catch (error) {
    console.error('Error fetching Imgflip memes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memes from Imgflip' },
      { status: 500 }
    )
  }
}