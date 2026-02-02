import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingNumber: string } }
) {
  const { bookingNumber } = params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Verification token required' },
      { status: 401 }
    )
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
