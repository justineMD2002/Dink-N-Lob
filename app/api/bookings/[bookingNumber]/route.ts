import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingNumber: string } }
) {
  const { bookingNumber } = params
  const supabase = await createClient()
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      court:courts(name),
      payment:payments(*)
    `)
    .eq('booking_number', bookingNumber)
    .single()
  if (error || !booking) {
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    )
  }
  return NextResponse.json(booking)
}
