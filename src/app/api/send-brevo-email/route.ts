import { sendBrevoEmail } from '@/lib/brevo-email'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json()

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, and either html or text' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Send email via Brevo API
    const result = await sendBrevoEmail({ to, subject, html, text })

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('❌ Error in send-brevo-email API route:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}