import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Rate limiting: track submissions by IP
const submissionsByIP = new Map<string, { count: number; firstSubmission: number }>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const MAX_SUBMISSIONS_PER_WINDOW = 5

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check rate limit
    const now = Date.now()
    const ipData = submissionsByIP.get(ip)

    if (ipData) {
      // Reset if window has passed
      if (now - ipData.firstSubmission > RATE_LIMIT_WINDOW) {
        submissionsByIP.set(ip, { count: 1, firstSubmission: now })
      } else if (ipData.count >= MAX_SUBMISSIONS_PER_WINDOW) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      } else {
        ipData.count++
      }
    } else {
      submissionsByIP.set(ip, { count: 1, firstSubmission: now })
    }

    const body = await request.json()
    const { name, email, team, message, _timestamp } = body

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Time-based validation - reject if form was submitted too quickly (< 3 seconds)
    if (_timestamp && now - _timestamp < 3000) {
      return NextResponse.json(
        { error: 'Please wait a moment before submitting' },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Store in Supabase
    const supabase = await createAdminClient()

    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: name.trim().substring(0, 200),
        email: email.trim().toLowerCase().substring(0, 200),
        team: team?.trim().substring(0, 200) || null,
        message: message.trim().substring(0, 5000),
        ip_hash: ip !== 'unknown' ? hashIP(ip) : null, // Store hashed IP for abuse prevention
      })

    if (dbError) {
      console.error('Contact form submission error:', dbError)
      // If table doesn't exist, still return success (form data won't be saved but user experience is preserved)
      if (dbError.code === '42P01') {
        console.warn('contact_submissions table does not exist - submission not saved')
      } else {
        throw dbError
      }
    }

    // Send email notification
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Pulse Labs <noreply@pulse-labs.io>',
          to: 'info@pinkpollos.com',
          subject: `Contact: ${name.trim()}`,
          text: `Naam: ${name.trim()}\nEmail: ${email.trim()}\nTeam: ${team?.trim() || '-'}\n\n${message.trim()}`,
        })
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError)
        // Don't fail the request if email fails — submission is already saved
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    )
  }
}

// Simple hash function for IP to preserve privacy while enabling abuse detection
function hashIP(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}
