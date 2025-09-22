import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, generateVerificationEmailHTML } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing email send to:', email)

    // Test email send
    const result = await sendEmail({
      to: email,
      subject: 'Test Email from MemeHub',
      html: generateVerificationEmailHTML('Test User', 'http://localhost:3000/auth/verify-email?token=test-token'),
    })

    console.log('📧 Test email result:', result)

    return NextResponse.json({
      success: result.success,
      error: result.error,
      previewUrl: result.previewUrl,
      message: result.success ? 'Test email sent successfully!' : 'Test email failed'
    })
  } catch (error) {
    console.error('❌ Test email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}