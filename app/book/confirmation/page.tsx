'use client'
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
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
  }[] | {
    payment_method: string
    reference_code: string
  }
}

function ConfirmationPageContent() {
  const searchParams = useSearchParams()
  const encryptedRef = searchParams.get('ref')
  // Fallback to old method for backward compatibility
  const bookingNumber = searchParams.get('bookingNumber')
  const token = searchParams.get('token')
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const copyLinkToClipboard = () => {
    const currentUrl = window.location.href
    navigator.clipboard.writeText(currentUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  useEffect(() => {
    const fetchBookingData = () => {
      // Use encrypted reference if available, otherwise fall back to old method
      if (encryptedRef) {
        fetch(`/api/bookings/ref?ref=${encodeURIComponent(encryptedRef)}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error('Invalid or unauthorized access')
            }
            return res.json()
          })
          .then((data) => {
            setBookingData(data)
            setError(null)
            setLoading(false)
          })
          .catch((err) => {
            setError(err.message || 'Failed to load booking')
            setLoading(false)
          })
      } else if (bookingNumber && token) {
        // Fallback to old method for backward compatibility
        fetch(`/api/bookings/${bookingNumber}?token=${encodeURIComponent(token)}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error('Invalid or unauthorized access')
            }
            return res.json()
          })
          .then((data) => {
            setBookingData(data)
            setError(null)
            setLoading(false)
          })
          .catch((err) => {
            setError(err.message || 'Failed to load booking')
            setLoading(false)
          })
      } else {
        setError('Missing booking information')
        setLoading(false)
      }
    }

    fetchBookingData()

    if (encryptedRef || (bookingNumber && token)) {
      const supabase = createClient()

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

      return () => {
        supabase.removeChannel(bookingsChannel)
        supabase.removeChannel(paymentsChannel)
      }
    }
  }, [encryptedRef, bookingNumber, token])
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-4 flex items-center justify-center">
        <div className="text-gray-900">Loading booking details...</div>
      </div>
    )
  }
  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.png" alt="Dink N' Lob" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error === 'Invalid or unauthorized access' ? 'Unauthorized Access' : 'Booking Not Found'}
          </h1>
          <p className="text-gray-600 mb-4">
            {error === 'Invalid or unauthorized access'
              ? 'The link you used is invalid or has expired.'
              : 'We could not find the booking you are looking for.'}
          </p>
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
            <p className="text-xs sm:text-sm text-gray-500 mt-2">Please save this number for your reference</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-yellow-800 mb-1">Important: Save This Link!</h3>
                <p className="text-xs sm:text-sm text-yellow-700 mb-2">
                  Bookmark this page or save this link to track your booking status. This is the only way to check if your payment has been verified and your booking confirmed.
                </p>
                <button
                  onClick={copyLinkToClipboard}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-sm rounded-md transition font-medium"
                >
                  {linkCopied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="border-t pt-3 sm:pt-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Booking Details</h2>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{bookingData.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold text-gray-900">{bookingData.customer_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-semibold text-gray-900">{bookingData.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Court:</span>
                <span className="font-semibold text-gray-900">{bookingData.court.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold text-gray-900">{bookingData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold text-gray-900">{bookingData.start_time} - {bookingData.end_time}</span>
              </div>
            </div>
          </div>
          <div className="border-t mt-3 sm:mt-4 pt-3 sm:pt-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Payment Details</h2>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold text-gray-900">
                  {Array.isArray(bookingData.payment)
                    ? bookingData.payment[0]?.payment_method
                    : bookingData.payment?.payment_method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference Code:</span>
                <span className="font-semibold text-gray-900">
                  {Array.isArray(bookingData.payment)
                    ? bookingData.payment[0]?.reference_code
                    : bookingData.payment?.reference_code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-primary">₱{bookingData.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  bookingData.status === 'CONFIRMED'
                    ? 'bg-green-500 text-white border border-green-600'
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
              <span><strong>Save this link</strong> - Bookmark this page to track your booking status in real-time</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary font-bold mr-2">2.</span>
              <span>Our team will verify your payment within 24 hours</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary font-bold mr-2">3.</span>
              <span>You will receive an email confirmation once verified</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary font-bold mr-2">4.</span>
              <span>Please arrive 10 minutes before your scheduled time</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary font-bold mr-2">5.</span>
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

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    }>
      <ConfirmationPageContent />
    </Suspense>
  )
}
