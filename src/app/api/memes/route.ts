import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') || 'latest'
    const timeframe = searchParams.get('timeframe') || 'daily'
    
    const skip = (page - 1) * limit

    let orderBy: Record<string, any> = { createdAt: 'desc' } // default to latest

    switch (sort) {
      case 'popular':
        orderBy = [
          { upvotes: 'desc' },
          { createdAt: 'desc' }
        ]
        break
      case 'trending':
        // For trending, we'll use a simple algorithm: recent memes with high score
        // Apply timeframe filter for trending
        orderBy = [
          { 
            upvotes: { 
              _count: 'desc' 
            }
          },
          { createdAt: 'desc' }
        ]
        break
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Build where clause for trending timeframe
    const whereClause: Record<string, any> = {}
    if (sort === 'trending' && timeframe !== 'all') {
      let dateFilter: Date | undefined
      const now = new Date()
      switch (timeframe) {
        case 'daily':
          dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'weekly':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'monthly':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }
      if (dateFilter) {
        whereClause.createdAt = {
          gte: dateFilter
        }
      }
    }

    const memes = await prisma.meme.findMany({
      skip,
      take: limit,
      where: whereClause,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true
          }
        }
      }
    })

    // Check if there are more memes
    const totalMemes = await prisma.meme.count({ where: whereClause })
    const hasMore = skip + limit < totalMemes

    return NextResponse.json({
      memes,
      hasMore,
      total: totalMemes,
      page,
      limit
    })

  } catch (error) {
    console.error('Error fetching memes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}