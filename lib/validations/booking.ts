import { z } from 'zod'

// Philippine phone number regex
const PHONE_REGEX = /^(09\d{9}|\+639\d{9})$/

// Time format regex (HH:mm)
const TIME_REGEX = /^([0-1][0-9]|2[0-2]):00$/

export const createBookingSchema = z.object({
  customer_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-\.]+$/, 'Name can only contain letters, spaces, hyphens, and periods'),

  customer_email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),

  customer_phone: z
    .string()
    .regex(PHONE_REGEX, 'Invalid Philippine phone number (09XXXXXXXXX or +639XXXXXXXXX)'),

  court_id: z
    .string()
    .uuid('Invalid court ID'),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine((date) => {
      const bookingDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return bookingDate >= today
    }, 'Booking date must be today or in the future')
    .refine((date) => {
      const bookingDate = new Date(date)
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + 30)
      return bookingDate <= maxDate
    }, 'Bookings can only be made up to 30 days in advance'),

  start_time: z
    .string()
    .regex(TIME_REGEX, 'Invalid start time format (HH:00)')
    .refine((time) => {
      const hour = parseInt(time.split(':')[0])
      return hour >= 6 && hour < 22
    }, 'Start time must be between 06:00 and 21:00'),

  end_time: z
    .string()
    .regex(TIME_REGEX, 'Invalid end time format (HH:00)')
    .refine((time) => {
      const hour = parseInt(time.split(':')[0])
      return hour >= 7 && hour <= 22
    }, 'End time must be between 07:00 and 22:00'),

  payment_method: z.enum(['GCASH', 'MAYA'], {
    errorMap: () => ({ message: 'Payment method must be GCASH or MAYA' })
  }),

  reference_code: z
    .string()
    .min(1, 'Payment reference code is required')
    .max(100, 'Reference code must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\-]+$/, 'Reference code can only contain letters, numbers, and hyphens'),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal('')),
}).refine((data) => {
  const startHour = parseInt(data.start_time.split(':')[0])
  const endHour = parseInt(data.end_time.split(':')[0])
  return endHour > startHour
}, {
  message: 'End time must be after start time',
  path: ['end_time']
}).refine((data) => {
  const startHour = parseInt(data.start_time.split(':')[0])
  const endHour = parseInt(data.end_time.split(':')[0])
  const duration = endHour - startHour
  return duration <= 8
}, {
  message: 'Maximum booking duration is 8 hours',
  path: ['end_time']
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
