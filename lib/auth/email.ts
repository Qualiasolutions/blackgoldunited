// Email Utilities for Authentication - BlackGoldUnited ERP
import nodemailer from 'nodemailer'

// Email transporter configuration
const createTransporter = () => {
  // In production, configure with your SMTP settings
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })
  } else {
    // For development, use Ethereal Email (test account)
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    })
  }
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetToken: string
): Promise<void> {
  const transporter = createTransporter()

  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset - BlackGoldUnited ERP</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button {
          display: inline-block;
          background: #000;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BlackGoldUnited ERP</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hello ${firstName},</p>
          <p>We received a request to reset your password for your BlackGoldUnited ERP account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, please ignore this email or contact your administrator if you have concerns.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from BlackGoldUnited ERP System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
    BlackGoldUnited ERP - Password Reset Request

    Hello ${firstName},

    We received a request to reset your password for your BlackGoldUnited ERP account.

    Please click on the following link to reset your password:
    ${resetUrl}

    This link will expire in 1 hour.

    If you didn't request a password reset, please ignore this email or contact your administrator if you have concerns.

    This is an automated message from BlackGoldUnited ERP System.
    Please do not reply to this email.
  `

  try {
    const info = await transporter.sendMail({
      from: `"BlackGoldUnited ERP" <${process.env.FROM_EMAIL || 'noreply@blackgoldunited.com'}>`,
      to: email,
      subject: 'Password Reset - BlackGoldUnited ERP',
      text: textContent,
      html: htmlContent
    })

    console.log('Password reset email sent:', info.messageId)

    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
    }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}

export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  temporaryPassword?: string
): Promise<void> {
  const transporter = createTransporter()

  const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to BlackGoldUnited ERP</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button {
          display: inline-block;
          background: #000;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .credentials { background: #fff; padding: 15px; border-left: 4px solid #000; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to BlackGoldUnited ERP</h1>
        </div>
        <div class="content">
          <h2>Account Created Successfully</h2>
          <p>Hello ${firstName},</p>
          <p>Welcome to BlackGoldUnited ERP System! Your account has been created successfully.</p>

          ${temporaryPassword ? `
          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
            <p><em>Please change your password after your first login.</em></p>
          </div>
          ` : ''}

          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to ERP System</a>
          </p>

          <p>If you have any questions or need assistance, please contact your system administrator.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from BlackGoldUnited ERP System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"BlackGoldUnited ERP" <${process.env.FROM_EMAIL || 'noreply@blackgoldunited.com'}>`,
      to: email,
      subject: 'Welcome to BlackGoldUnited ERP',
      html: htmlContent
    })

    console.log('Welcome email sent to:', email)
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    throw new Error('Failed to send welcome email')
  }
}

export async function sendPasswordChangedNotification(
  email: string,
  firstName: string
): Promise<void> {
  const transporter = createTransporter()

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Changed - BlackGoldUnited ERP</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BlackGoldUnited ERP</h1>
        </div>
        <div class="content">
          <h2>Password Changed Successfully</h2>
          <p>Hello ${firstName},</p>
          <p>This is to confirm that your password for BlackGoldUnited ERP account has been changed successfully.</p>
          <p>If you did not make this change, please contact your system administrator immediately.</p>
          <p>Time of change: ${new Date().toLocaleString()}</p>
        </div>
        <div class="footer">
          <p>This is an automated message from BlackGoldUnited ERP System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"BlackGoldUnited ERP" <${process.env.FROM_EMAIL || 'noreply@blackgoldunited.com'}>`,
      to: email,
      subject: 'Password Changed - BlackGoldUnited ERP',
      html: htmlContent
    })

    console.log('Password changed notification sent to:', email)
  } catch (error) {
    console.error('Failed to send password changed notification:', error)
    // Don't throw error for notification emails
  }
}