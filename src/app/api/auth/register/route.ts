import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { sendEmail, generateVerificationEmailHTML } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, displayName } = await request.json()

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('🔍 Registration attempt:', { email, username })

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      console.log('❌ User already exists:', { 
        existingEmail: existingUser.email, 
        existingUsername: existingUser.username,
        newEmail: email,
        newUsername: username
      })
      
      // Check which field is causing the conflict
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }
      
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'A user with this username already exists' },
          { status: 400 }
        )
      }
      
      // Fallback error
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log('🔐 Creating user with hashed password')

    // Create user (email not verified yet)
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: displayName || username,
        hashedPassword,
        emailVerified: null, // Explicitly set to null - user needs to verify
      }
    })

    console.log('✅ User created successfully:', { 
      id: user.id, 
      email: user.email, 
      username: user.username 
    })

    // Generate verification token
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    console.log('🔑 Generating verification token for user:', user.id)

    // Create verification token
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
      subject: 'Welcome to MemeHub - Verify Your Email',
      html: generateVerificationEmailHTML(user.displayName || user.username, verificationUrl)
    })

    console.log('📧 Email result:', emailResult)

    if (!emailResult.success) {
      // If email fails, still return success but note the issue
      console.error('❌ Failed to send verification email:', emailResult.error)
    } else {
      console.log('✅ Verification email sent successfully to:', email)
      if (emailResult.previewUrl) {
        console.log('📎 Preview URL:', emailResult.previewUrl)
      }
    }

    return NextResponse.json({
      message: 'Account created successfully! Please check your email to verify your account.',
      requiresVerification: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        emailVerified: false
      }
    })
  } catch (error) {
    console.error('❌ Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}