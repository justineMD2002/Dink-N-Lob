import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { decryptBookingReference } from '@/lib/encryption'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookingNumber: string }> }
) {
  const { searchParams } = new URL(request.url)
  const params = await context.params

  // Check if using encrypted reference (new method)
  const encryptedRef = searchParams.get('ref')

  let bookingNumber: string
  let token: string

  if (encryptedRef) {
    // Decrypt the reference
    const decrypted = decryptBookingReference(encryptedRef)

    if (!decrypted) {
      return NextResponse.json(
        { error: 'Invalid or corrupted booking reference' },
        { status: 400 }
      )
    }

    bookingNumber = decrypted.bookingNumber
    token = decrypted.token
  } else {
    // Fallback to old method for backward compatibility
    bookingNumber = params.bookingNumber
    token = searchParams.get('token') || ''

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token required' },
        { status: 401 }
      )
    }
  }

  const supabase = await createClient()
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      court:courts(name),
      payment:payments(*)
    `)
    .eq('booking_number', bookingNumber)
    .eq('verification_token', token)
    .single()

  if (error || !booking) {
    return NextResponse.json(
      { error: 'Booking not found or invalid verification token' },
      { status: 404 }
    )
  }

  return NextResponse.json(booking)
}
