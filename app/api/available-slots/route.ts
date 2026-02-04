import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface TimeSlot {
  time: string
  available: boolean
}

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

  // Get current date and time in Philippines timezone (UTC+8)
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

  const availableSlots = allSlots
    .map((time) => {
      const slotHour = parseInt(time.split(':')[0])

      // Filter out past time slots if booking is for today
      if (isToday) {
        // Only hide slots from previous hours (current hour still shows)
        if (slotHour < currentHour) {
          return null
        }
      }

      const isBooked = bookings?.some((booking) => {
        return time >= booking.start_time && time < booking.end_time
      })

      return {
        time,
        available: !isBooked,
      }
    })
    .filter(slot => slot !== null) as TimeSlot[]
  return NextResponse.json(availableSlots)
}
