import nodemailer from 'nodemailer'
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport'

// Email service configuration
const createTransporter = async () => {
  // Use Brevo SMTP configuration if environment variables are set
  if (process.env.SMTP_SERVER && process.env.SMTP_LOGIN && process.env.SMTP_KEY) {
    console.log('📧 Using Brevo SMTP configuration')
    return nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_KEY,
      },
    });
  }

  // In development, use Ethereal Email (test email service)
  if (process.env.NODE_ENV === 'development') {
    try {
      // Create a test account automatically
      const testAccount = await nodemailer.createTestAccount()
      
      console.log('📧 Created Ethereal test account:', {
        user: testAccount.user,
        web: testAccount.web
      })
      
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    } catch (error) {
      console.error('❌ Failed to create Ethereal test account:', error)
      // Fallback to console logging
      return {
        sendMail: async (mailOptions: any) => {
          console.log('📧 EMAIL SIMULATED (no email service configured):', mailOptions)
          return {
            messageId: 'simulated-message-id',
            envelope: { from: '', to: [] },
            accepted: [],
            rejected: [],
            pending: [],
            response: 'Email simulation'
          } as SentMessageInfo
        }
      }
    }
  }
  
  // In production without Brevo config, log a warning
  console.warn('⚠️  No email configuration found. Emails will not be sent.')
  return {
    sendMail: async (mailOptions: any) => {
      console.log('📧 EMAIL NOT CONFIGURED:', mailOptions)
      return {
        messageId: 'not-configured',
        envelope: { from: '', to: [] },
        accepted: [],
        rejected: [],
        pending: [],
        response: 'Email not configured'
      } as SentMessageInfo
    }
  }
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = await createTransporter()
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@memehub.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    }

    const info = await transporter.sendMail(mailOptions)
    
    if (process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      console.log('📧 Email sent successfully!')
      console.log('📎 Preview URL:', previewUrl)
      console.log('📨 To:', options.to)
      console.log('📝 Subject:', options.subject)
      return { success: true, messageId: info.messageId, previewUrl }
    }
    
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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