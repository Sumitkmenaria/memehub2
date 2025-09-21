import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const memeId = resolvedParams.id

    if (!memeId) {
      return NextResponse.json(
        { error: 'Meme ID is required' },
        { status: 400 }
      )
    }

    // Fetch the meme with author information and tags
    const meme = await prisma.meme.findUnique({
      where: {
        id: memeId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    if (!meme) {
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      )
    }

    // Get vote counts
    const voteCounts = await prisma.vote.groupBy({
      by: ['type'],
      where: {
        memeId: memeId,
      },
      _count: {
        type: true,
      },
    })

    const upvotes = voteCounts.find(v => v.type === 'UPVOTE')?._count.type || 0
    const downvotes = voteCounts.find(v => v.type === 'DOWNVOTE')?._count.type || 0

    // Increment view count
    await prisma.meme.update({
      where: { id: memeId },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    // Format the response
    const formattedMeme = {
      id: meme.id,
      title: meme.title,
      description: meme.description,
      imageUrl: meme.imageUrl,
      memeType: meme.memeType,
      upvotes: upvotes,
      downvotes: downvotes,
      views: meme.views + 1, // Include the increment
      shareCount: meme.shareCount,
      createdAt: meme.createdAt.toISOString(),
      author: meme.author,
      tags: meme.tags,
      _count: meme._count,
    }

    return NextResponse.json(formattedMeme)
  } catch (error) {
    console.error('Error fetching meme:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meme' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const memeId = resolvedParams.id

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

    // Find the meme and check ownership
    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
    })

    if (!meme) {
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      )
    }

    // Check if user owns the meme
    if (meme.authorId !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own memes' },
        { status: 403 }
      )
    }

    // Delete associated file
    try {
      const filePath = join(process.cwd(), 'public', meme.imageUrl)
      await unlink(filePath)
    } catch (error) {
      // File might not exist, continue with deletion
      console.warn('Failed to delete file:', error)
    }

    // Delete the meme (cascade deletes will handle related data)
    await prisma.meme.delete({
      where: { id: memeId },
    })

    return NextResponse.json({
      message: 'Meme deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting meme:', error)
    return NextResponse.json(
      { error: 'Failed to delete meme' },
      { status: 500 }
    )
  }
}