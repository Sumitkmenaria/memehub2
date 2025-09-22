import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, generateVerificationEmailHTML } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Resend verification request for email:', email)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ User not found for email:', email)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      console.log('✅ Email already verified for user:', user.id)
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate verification token
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    console.log('🔑 Generating new verification token for user:', user.id)

    // Delete any existing verification tokens for this user
    await (prisma as any).verificationToken.deleteMany({
      where: {
        email,
        type: 'EMAIL_VERIFICATION'
      }
    })

    // Create new verification token
    await (prisma as any).verificationToken.create({
      data: {
        token,
        email,
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        expiresAt
      }
    })

    // Generate verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`

    console.log('📧 Sending verification email to:', email)

    // Send verification email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Verify Your Email - MemeHub',
      html: generateVerificationEmailHTML(user.displayName || user.username, verificationUrl)
    })

    console.log('📧 Email result:', emailResult)

    if (!emailResult.success) {
      console.error('❌ Failed to send verification email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send verification email: ' + (emailResult.error || 'Unknown error') },
        { status: 500 }
      )
    } else {
      console.log('✅ Verification email resent successfully to:', email)
      if (emailResult.previewUrl) {
        console.log('📎 Preview URL:', emailResult.previewUrl)
      }
    }

    return NextResponse.json({
      message: 'Verification email sent successfully'
    })
  } catch (error) {
    console.error('❌ Send verification email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}