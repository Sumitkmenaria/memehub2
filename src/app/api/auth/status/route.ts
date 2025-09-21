import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        message: 'Not authenticated'
      })
    }

    // Get full user data from database
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || '' },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            memes: true,
            followers: true,
            following: true
          }
        }
      }
    })

    return NextResponse.json({
      authenticated: true,
      user: user,
      session: {
        expires: session.expires,
        user: session.user
      },
      message: 'Authenticated successfully'
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Authentication check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}