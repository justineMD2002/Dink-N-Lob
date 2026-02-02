'use client'
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from '@/lib/supabase/client'
interface BookingData {
  booking_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  court: { name: string }
  date: string
  start_time: string
  end_time: string
  total_amount: string
  status: string
  payment: {
    payment_method: string
    reference_code: string
  }[]
}
export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const bookingNumber = searchParams.get('bookingNumber')
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const fetchBookingData = () => {
      if (bookingNumber) {
        fetch(`/api/bookings/${bookingNumber}`)
          .then((res) => res.json())
          .then((data) => {
            setBookingData(data)
            setLoading(false)
          })
          .catch((err) => {
            console.error('Error fetching booking:', err)
            setLoading(false)
          })
      }
    }

    fetchBookingData()

    if (bookingNumber) {
      const supabase = createClient()

      // Subscribe to bookings changes
      const bookingsChannel = supabase
        .channel('confirmation-bookings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
          },
          (payload) => {
            fetchBookingData()
          }
        )
        .subscribe()

      // Subscribe to payments changes
      const paymentsChannel = supabase
        .channel('confirmation-payments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
          },
          (payload) => {
            fetchBookingData()
          }
        )
        .subscribe()

      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(bookingsChannel)
        supabase.removeChannel(paymentsChannel)
      }
    }
  }, [bookingNumber])
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-4 flex items-center justify-center">
        <div className="text-gray-900">Loading booking details...</div>
      </div>
    )
  }
  if (!bookingData) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.png" alt="Dink N' Lob" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <Link href="/book" className="text-primary hover:underline">
            Make a new booking
          </Link>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="text-center mb-4 sm:mb-6">
            <img src="/logo.png" alt="Dink N' Lob" className="w-16 h-16 mx-auto mb-4 object-contain" />
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {bookingData.status === 'CONFIRMED' ? 'Booking Confirmed!' :
               bookingData.status === 'CANCELLED' ? 'Booking Cancelled' :
               'Booking Received!'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {bookingData.status === 'CONFIRMED'
                ? 'Your booking has been verified and confirmed.'
                : bookingData.status === 'CANCELLED'
                ? 'Your booking has been cancelled by the admin.'
                : 'Your booking has been received and is pending verification.'}
            </p>
          </div>
          <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Your Booking Number</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{bookingData.booking_number}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">Please save this number for your reference</p>
          </div>
          <div className="border-t dark:border-gray-700 pt-3 sm:pt-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Booking Details</h2>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bookingData.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bookingData.customer_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bookingData.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Court:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bookingData.court.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Date:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bookingData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Time:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bookingData.start_time} - {bookingData.end_time}</span>
              </div>
            </div>
          </div>
          <div className="border-t dark:border-gray-700 mt-3 sm:mt-4 pt-3 sm:pt-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Payment Details</h2>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bookingData.payment[0]?.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Reference Code:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bookingData.payment[0]?.reference_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-primary">₱{bookingData.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  bookingData.status === 'CONFIRMED'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : bookingData.status === 'PENDING_VERIFICATION'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : bookingData.status === 'CANCELLED'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  {bookingData.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">What happens next?</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-primary font-bold mr-2">1.</span>
              <span>Our team will verify your payment within 24 hours</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary font-bold mr-2">2.</span>
              <span>You will receive an email confirmation once verified</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary font-bold mr-2">3.</span>
              <span>Please arrive 10 minutes before your scheduled time</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary font-bold mr-2">4.</span>
              <span>Bring your booking number for check-in</span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center print:hidden">
          <Link
            href="/"
            className="px-4 sm:px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition text-center font-medium"
          >
            Back to Home
          </Link>
          <Link
            href="/book"
            className="px-4 sm:px-6 py-3 bg-primary text-white text-sm sm:text-base rounded-lg hover:bg-primary/90 transition text-center font-medium"
          >
            Make Another Booking
          </Link>
        </div>
        <div className="text-center mt-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="text-primary hover:underline text-xs sm:text-sm font-medium"
          >
            Print Booking Confirmation
          </button>
        </div>
      </div>
    </div>
  );
}
