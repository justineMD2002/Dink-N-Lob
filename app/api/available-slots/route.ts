import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
const OPERATING_START = '06:00'
const OPERATING_END = '22:00'
const SLOT_DURATION = 60
function generateTimeSlots() {
  const slots = []
  let currentHour = 6
  while (currentHour < 22) {
    const time = `${currentHour.toString().padStart(2, '0')}:00`
    slots.push(time)
    currentHour++
  }
  return slots
}
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')
  const courtId = searchParams.get('courtId')
  if (!date || !courtId) {
    return NextResponse.json(
      { error: 'Date and courtId are required' },
      { status: 400 }
    )
  }
  const supabase = await createClient()
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('start_time, end_time, duration')
    .eq('court_id', courtId)
    .eq('date', date)
    .in('status', ['CONFIRMED', 'PENDING_VERIFICATION'])
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const allSlots = generateTimeSlots()
  const availableSlots = allSlots.map((time) => {
    const isBooked = bookings?.some((booking) => {
      return time >= booking.start_time && time < booking.end_time
    })
    return {
      time,
      available: !isBooked,
    }
  })
  return NextResponse.json(availableSlots)
}
