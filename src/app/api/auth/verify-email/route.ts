import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find the verification token
    const verificationToken = await (prisma as any).verificationToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > verificationToken.expiresAt) {
      // Delete expired token
      await (prisma as any).verificationToken.delete({
        where: { id: verificationToken.id }
      })
      
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      )
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() }
    })

    // Delete the verification token
    await (prisma as any).verificationToken.delete({
      where: { id: verificationToken.id }
    })

    return NextResponse.json({
      message: 'Email verified successfully'
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}