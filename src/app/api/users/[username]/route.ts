import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { VoteType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const resolvedParams = await params
    const { username } = resolvedParams
    
    // Get user profile with stats
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            memes: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's memes with pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const memes = await prisma.meme.findMany({
      where: { authorId: user.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
        votes: {
          select: {
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Calculate vote counts for each meme
    const memesWithVotes = memes.map((meme: any) => ({
      ...meme,
      upvotes: meme.votes.filter((vote: { type: VoteType }) => vote.type === 'UPVOTE').length,
      downvotes: meme.votes.filter((vote: { type: VoteType }) => vote.type === 'DOWNVOTE').length,
      votes: undefined, // Remove raw votes from response
    }))

    const totalMemes = await prisma.meme.count({
      where: { authorId: user.id },
    })

    return NextResponse.json({
      user,
      memes: memesWithVotes,
      pagination: {
        page,
        limit,
        total: totalMemes,
        totalPages: Math.ceil(totalMemes / limit),
        hasNext: page * limit < totalMemes,
      },
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}