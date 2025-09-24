import { EmailOptions } from './email'

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY || ''
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

interface BrevoEmailOptions {
  sender: {
    name?: string
    email: string
  }
  to: Array<{
    name?: string
    email: string
  }>
  subject: string
  htmlContent?: string
  textContent?: string
  replyTo?: {
    name?: string
    email: string
  }
}

interface BrevoApiResponse {
  messageId: string
  messageIds?: string[]
}

interface BrevoApiError {
  code: string
  message: string
}

export const sendBrevoEmail = async (options: EmailOptions) => {
  try {
    const brevoOptions: BrevoEmailOptions = {
      sender: {
        name: 'MemeHub',
        email: process.env.FROM_EMAIL || 'noreply@memehub.com'
      },
      to: [{
        email: options.to
      }],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text
    }

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(brevoOptions)
    })

    if (!response.ok) {
      const errorData: BrevoApiError = await response.json()
      throw new Error(`Brevo API error: ${errorData.message} (code: ${errorData.code})`)
    }

    const data: BrevoApiResponse = await response.json()
    
    return { 
      success: true, 
      messageId: data.messageId || (data.messageIds ? data.messageIds[0] : null) 
    }
  } catch (error) {
    console.error('❌ Brevo email sending failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const generateVerificationEmailHTML = (username: string, verificationUrl: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - MemeHub</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to MemeHub!</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Let's verify your email address</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${username}</strong>,</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Thanks for signing up for MemeHub! To complete your registration and start sharing amazing memes, 
          please verify your email address by clicking the button below.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; transition: background 0.3s;">
            Verify Email Address
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
          If the button doesn't work, you can also click on this link:
        </p>
        <p style="font-size: 14px; word-break: break-all; color: #667eea;">
          <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
            <strong>Why verify your email?</strong>
          </p>
          <ul style="font-size: 14px; color: #666; margin-left: 20px;">
            <li>Secure your account</li>
            <li>Receive important notifications</li>
            <li>Reset your password if needed</li>
            <li>Connect with the MemeHub community</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #999; margin-top: 30px; text-align: center;">
          This verification link will expire in 24 hours. If you didn't sign up for MemeHub, you can safely ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>© 2024 MemeHub. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}