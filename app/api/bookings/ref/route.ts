import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { decryptBookingReference } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const encryptedRef = searchParams.get('ref')

  if (!encryptedRef) {
    return NextResponse.json(
      { error: 'Booking reference required' },
      { status: 400 }
    )
  }

  // Decrypt the reference
  const decrypted = decryptBookingReference(encryptedRef)

  if (!decrypted) {
    return NextResponse.json(
      { error: 'Invalid or corrupted booking reference' },
      { status: 400 }
    )
  }

  const { bookingNumber, token } = decrypted

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
