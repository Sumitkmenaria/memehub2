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

    const { memeId, voteType } = await request.json()

    if (!memeId || !voteType || !['UPVOTE', 'DOWNVOTE'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid vote data' },
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

    // Check for existing vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_memeId: {
          userId: user.id,
          memeId: memeId
        }
      }
    })

    let newUpvotes = meme.upvotes
    let newDownvotes = meme.downvotes

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Remove vote if clicking same vote type
        await prisma.vote.delete({
          where: { id: existingVote.id }
        })

        // Update meme counts
        if (voteType === 'UPVOTE') {
          newUpvotes = Math.max(0, meme.upvotes - 1)
        } else {
          newDownvotes = Math.max(0, meme.downvotes - 1)
        }
      } else {
        // Change vote type
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: voteType }
        })

        // Update meme counts
        if (voteType === 'UPVOTE') {
          newUpvotes = meme.upvotes + 1
          newDownvotes = Math.max(0, meme.downvotes - 1)
        } else {
          newDownvotes = meme.downvotes + 1
          newUpvotes = Math.max(0, meme.upvotes - 1)
        }
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          type: voteType,
          userId: user.id,
          memeId: memeId
        }
      })

      // Update meme counts
      if (voteType === 'UPVOTE') {
        newUpvotes = meme.upvotes + 1
      } else {
        newDownvotes = meme.downvotes + 1
      }
    }

    // Update meme with new vote counts
    const updatedMeme = await prisma.meme.update({
      where: { id: memeId },
      data: {
        upvotes: newUpvotes,
        downvotes: newDownvotes
      }
    })

    return NextResponse.json({
      success: true,
      upvotes: updatedMeme.upvotes,
      downvotes: updatedMeme.downvotes,
      userVote: existingVote?.type === voteType ? null : voteType
    })

  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}