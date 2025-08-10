import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    console.log('📧 Sending email via Resend to:', to);
    
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use Resend's default domain (no DNS setup required)
      // TODO: After transferring to Cloudflare, switch to 'stories@memorias-ai.com'
      to: [to],
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend error:', error);
      
      // Provide specific error messages for common issues
      if (error.message && error.message.includes('You can only send testing emails to your own email address')) {
        return res.status(403).json({ 
          error: 'Email restricted: Can only send to verified email addresses in test mode. Please verify your domain in Resend dashboard or use chrismolhome@hotmail.com for testing.',
          details: error.message 
        });
      }
      
      return res.status(400).json({ error: error.message || 'Failed to send email' });
    }

    console.log('✅ Email sent successfully:', data);
    return res.status(200).json({ 
      success: true, 
      message: `Email sent to ${to}`,
      data: data
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
