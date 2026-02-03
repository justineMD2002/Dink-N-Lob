// Server-side booking calculations to prevent client manipulation

export const HOURLY_RATE = 299 // PHP per hour
export const OPERATING_HOURS = {
  start: 6, // 6 AM
  end: 22   // 10 PM
}

export function calculateBookingAmount(startTime: string, endTime: string): number {
  const startHour = parseInt(startTime.split(':')[0])
  const endHour = parseInt(endTime.split(':')[0])

  const duration = endHour - startHour

  if (duration <= 0) {
    throw new Error('Invalid time range: end time must be after start time')
  }

  if (duration > 8) {
    throw new Error('Maximum booking duration is 8 hours')
  }

  return duration * HOURLY_RATE
}

export function calculateDuration(startTime: string, endTime: string): number {
  const startHour = parseInt(startTime.split(':')[0])
  const endHour = parseInt(endTime.split(':')[0])

  return (endHour - startHour) * 60 // Return minutes
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  const startHour = parseInt(startTime.split(':')[0])
  const endHour = parseInt(endTime.split(':')[0])

  // Check if within operating hours
  if (startHour < OPERATING_HOURS.start || endHour > OPERATING_HOURS.end) {
    return false
  }

  // Check if end is after start
  if (endHour <= startHour) {
    return false
  }

  return true
}
