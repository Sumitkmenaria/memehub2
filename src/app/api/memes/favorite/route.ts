import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { memeId } = await request.json()

    if (!memeId) {
      return NextResponse.json(
        { error: 'Meme ID is required' },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if meme exists
    const meme = await prisma.meme.findUnique({
      where: { id: memeId }
    })

    if (!meme) {
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      )
    }

    // Check for existing favorite
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_memeId: {
          userId: user.id,
          memeId: memeId
        }
      }
    })

    let isFavorited = false

    if (existingFavorite) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: { id: existingFavorite.id }
      })
      isFavorited = false
    } else {
      // Add to favorites
      await prisma.favorite.create({
        data: {
          userId: user.id,
          memeId: memeId
        }
      })
      isFavorited = true
    }

    return NextResponse.json({
      success: true,
      isFavorited,
      message: isFavorited ? 'Added to favorites' : 'Removed from favorites'
    })

  } catch (error) {
    console.error('Favorite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's favorites with meme details
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        meme: {
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
                comments: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      favorites: favorites.map(fav => fav.meme)
    })

  } catch (error) {
    console.error('Get favorites error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}