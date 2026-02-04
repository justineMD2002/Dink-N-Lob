import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createBookingSchema } from '@/lib/validations/booking'
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { calculateBookingAmount, calculateDuration } from '@/lib/booking-utils'
import { sanitizeBookingData } from '@/lib/sanitize'
import { encryptBookingReference } from '@/lib/encryption'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 bookings per 15 minutes per IP
    const clientId = getClientIdentifier(request)
    const rateLimitResult = rateLimit(clientId, {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000 // 15 minutes
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many booking attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const body = await request.json()

    // Sanitize input to prevent XSS
    const sanitizedData = sanitizeBookingData(body)

    // Validate input with Zod
    const validatedData = createBookingSchema.parse(sanitizedData)

    const {
      customer_name,
      customer_email,
      customer_phone,
      court_id,
      date,
      start_time,
      end_time,
      notes,
      payment_method,
      reference_code,
    } = validatedData

    // Calculate amount and duration SERVER-SIDE (don't trust client)
    const total_amount = calculateBookingAmount(start_time, end_time)
    const duration = calculateDuration(start_time, end_time)

    // Prevent booking past time slots for today (using Philippines timezone UTC+8)
    const now = new Date()
    const philippinesTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
    const currentHour = philippinesTime.getHours()
    const currentMinute = philippinesTime.getMinutes()

    // Format today's date in YYYY-MM-DD format using Philippines timezone
    const year = philippinesTime.getFullYear()
    const month = String(philippinesTime.getMonth() + 1).padStart(2, '0')
    const day = String(philippinesTime.getDate()).padStart(2, '0')
    const todayDate = `${year}-${month}-${day}`

    const isToday = date === todayDate

    if (isToday) {
      const startHour = parseInt(start_time.split(':')[0])

      if (startHour < currentHour) {
        return NextResponse.json(
          { error: 'Cannot book past time slots. Please select a current or future time.' },
          { status: 400 }
        )
      }
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')

    const supabase = await createClient()

    // Check for booking conflicts BEFORE inserting
    // This helps prevent race conditions
    const { data: existingBookings, error: checkError } = await supabase
      .from('bookings')
      .select('id, start_time, end_time')
      .eq('court_id', court_id)
      .eq('date', date)
      .in('status', ['CONFIRMED', 'PENDING_VERIFICATION'])

    if (checkError) {
      console.error('Database error during conflict check:', checkError.code)
      return NextResponse.json(
        { error: 'Unable to check availability. Please try again.' },
        { status: 500 }
      )
    }

    // Check if the requested time conflicts with existing bookings
    const hasConflict = existingBookings?.some((booking) => {
      // Check if times overlap
      return (
        (start_time >= booking.start_time && start_time < booking.end_time) ||
        (end_time > booking.start_time && end_time <= booking.end_time) ||
        (start_time <= booking.start_time && end_time >= booking.end_time)
      )
    })

    if (hasConflict) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please select a different time.' },
        { status: 409 }
      )
    }

    // Use a transaction-like approach by creating booking first, then payment
    // If payment fails, we rollback by deleting the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_name,
        customer_email,
        customer_phone,
        court_id,
        date,
        start_time,
        end_time,
        duration,
        total_amount,
        notes: notes || null,
        status: 'PENDING_VERIFICATION',
        verification_token: verificationToken,
      })
      .select()
      .single()

    if (bookingError) {
      // Log error code but don't expose details to user
      console.error('Database error during booking creation:', bookingError.code)

      if (bookingError.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'This time slot was just booked by someone else. Please select a different time.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Unable to create booking. Please try again.' },
        { status: 500 }
      )
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        payment_method,
        reference_code,
        amount: total_amount,
        status: 'PENDING',
      })

    if (paymentError) {
      // Rollback: Delete the booking if payment creation fails
      await supabase.from('bookings').delete().eq('id', booking.id)

      console.error('Database error during payment creation:', paymentError.code)
      return NextResponse.json(
        { error: 'Unable to process payment information. Please try again.' },
        { status: 500 }
      )
    }

    // Encrypt booking reference for URL
    const encryptedRef = encryptBookingReference({
      bookingNumber: booking.booking_number,
      token: verificationToken
    })

    // Return booking with encrypted reference
    return NextResponse.json(
      {
        ...booking,
        encrypted_reference: encryptedRef
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString()
        }
      }
    )

  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json(
        {
          error: firstError.message,
          field: firstError.path.join('.')
        },
        { status: 400 }
      )
    }

    // Handle other errors
    console.error('Unexpected error in booking API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
