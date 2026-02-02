// Database types
export type BookingStatus = 'PENDING_VERIFICATION' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
export type PaymentMethod = 'MAYA' | 'GCASH'
export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

export interface Court {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  booking_number: string

  // Customer info
  customer_name: string
  customer_email: string
  customer_phone: string

  // Booking details
  court_id: string
  date: string
  start_time: string
  end_time: string
  duration: number
  status: BookingStatus
  total_amount: number
  notes: string | null

  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  booking_id: string
  payment_method: PaymentMethod
  reference_code: string
  amount: number
  status: PaymentStatus
  verified_at: string | null
  verified_by: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  password: string
  created_at: string
  updated_at: string
}

export interface Settings {
  id: string
  key: string
  value: string
  description: string | null
  updated_at: string
}

// Form types
export interface BookingFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  court_id: string
  date: string
  start_time: string
  end_time: string
  duration: number
  total_amount: number
  notes?: string
  payment_method: PaymentMethod
  reference_code: string
}

// API Response types
export interface TimeSlot {
  time: string
  available: boolean
  booking_id?: string
}

export interface AvailableSlots {
  date: string
  court_id: string
  slots: TimeSlot[]
}
