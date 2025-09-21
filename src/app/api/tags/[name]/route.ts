import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{
    name: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const tagName = decodeURIComponent(resolvedParams.name).toLowerCase()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Find the tag
    const tag = await prisma.tag.findUnique({
      where: {
        name: tagName,
      },
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Get memes with this tag
    const memeRelations = await prisma.memeTag.findMany({
      where: {
        tagId: tag.id,
      },
      include: {
        meme: {
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
        },
      },
      orderBy: {
        meme: {
          createdAt: 'desc',
        },
      },
      skip,
      take: limit,
    })

    // Get vote counts for each meme
    const memes = await Promise.all(
      memeRelations.map(async (relation) => {
        const voteCounts = await prisma.vote.groupBy({
          by: ['type'],
          where: {
            memeId: relation.meme.id,
          },
          _count: {
            type: true,
          },
        })

        const upvotes = voteCounts.find(v => v.type === 'UPVOTE')?._count.type || 0
        const downvotes = voteCounts.find(v => v.type === 'DOWNVOTE')?._count.type || 0

        return {
          ...relation.meme,
          upvotes,
          downvotes,
        }
      })
    )

    // Get total count
    const total = await prisma.memeTag.count({
      where: {
        tagId: tag.id,
      },
    })

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
      },
      memes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching tag:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
      { status: 500 }
    )
  }
}