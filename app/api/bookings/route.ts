import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customer_name,
      customer_email,
      customer_phone,
      court_id,
      date,
      start_time,
      end_time,
      duration,
      total_amount,
      notes,
      payment_method,
      reference_code,
    } = body

    const verificationToken = crypto.randomBytes(32).toString('hex')

    const supabase = await createClient()
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
        notes,
        status: 'PENDING_VERIFICATION',
        verification_token: verificationToken,
      })
      .select()
      .single()
    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 })
    }
    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id: booking.id,
      payment_method,
      reference_code,
      amount: total_amount,
      status: 'PENDING',
    })
    if (paymentError) {
      await supabase.from('bookings').delete().eq('id', booking.id)
      return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }
    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
