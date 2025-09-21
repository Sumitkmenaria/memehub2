import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { memeId } = await request.json()

    if (!memeId) {
      return NextResponse.json(
        { error: 'Meme ID is required' },
        { status: 400 }
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

    // Increment share count
    const updatedMeme = await prisma.meme.update({
      where: { id: memeId },
      data: {
        shareCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      success: true,
      shareCount: updatedMeme.shareCount
    })

  } catch (error) {
    console.error('Share error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}