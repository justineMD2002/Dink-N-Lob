'use client'
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Calendar from "@/components/Calendar"
import Image from "next/image"
interface Court {
 id: string
 name: string
 description: string | null
}
interface TimeSlot {
 time: string
 available: boolean
}
export default function BookPage() {
 const router = useRouter()
 const [courts, setCourts] = useState<Court[]>([])
 const [courtsLoading, setCourtsLoading] = useState(true)
 const [selectedCourtId, setSelectedCourtId] = useState<string>('')
 const [selectedDate, setSelectedDate] = useState<string | null>(null)
 const [selectedTime, setSelectedTime] = useState<string | null>(null)
 const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
 const [paymentMethod, setPaymentMethod] = useState<'GCASH' | 'MAYA'>('GCASH')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [qrModalOpen, setQrModalOpen] = useState(false)
 const [formData, setFormData] = useState({
 customer_name: '',
 customer_email: '',
 customer_phone: '',
 notes: '',
 reference_code: '',
 })
 useEffect(() => {
 const loadCourts = async () => {
 try {
 setCourtsLoading(true)
 const res = await fetch('/api/courts')
 const data = await res.json()
 setCourts(data)
 if (data.length > 0) {
 setSelectedCourtId(data[0].id)
 }
 } catch (err) {
 console.error('Error fetching courts:', err)
 setError('Failed to load courts. Please refresh the page.')
 } finally {
 setCourtsLoading(false)
 }
 }
 loadCourts()
 }, [])
 useEffect(() => {
 if (selectedDate && selectedCourtId) {
 fetch(`/api/available-slots?date=${selectedDate}&courtId=${selectedCourtId}`)
 .then((res) => res.json())
 .then((data) => {
 setTimeSlots(data)
 setSelectedTime(null)
 })
 .catch((err) => console.error('Error fetching slots:', err))
 }
 }, [selectedDate, selectedCourtId])
 useEffect(() => {
 const handleEscape = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 setQrModalOpen(false)
 }
 }
 if (qrModalOpen) {
 document.addEventListener('keydown', handleEscape)
 document.body.style.overflow = 'hidden'
 }
 return () => {
 document.removeEventListener('keydown', handleEscape)
 document.body.style.overflow = 'unset'
 }
 }, [qrModalOpen])
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setError(null)
 if (!selectedDate || !selectedTime || !selectedCourtId) {
 setError('Please select a date, time, and court')
 return
 }
 const phoneRegex = /^(09\d{9}|\+639\d{9})$/
 if (!phoneRegex.test(formData.customer_phone)) {
 setError('Please enter a valid Philippine phone number (09XXXXXXXXX or +639XXXXXXXXX)')
 return
 }
 setLoading(true)
 try {
 const endHour = parseInt(selectedTime.split(':')[0]) + 1
 const endTime = `${endHour.toString().padStart(2, '0')}:00`
 const bookingData = {
 ...formData,
 court_id: selectedCourtId,
 date: selectedDate,
 start_time: selectedTime,
 end_time: endTime,
 duration: 60,
 total_amount: 500,
 payment_method: paymentMethod,
 }
 const response = await fetch('/api/bookings', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify(bookingData),
 })
 if (!response.ok) {
 const errorData = await response.json()
 throw new Error(errorData.error || 'Failed to create booking')
 }
 const booking = await response.json()
 router.push(`/book/confirmation?bookingNumber=${booking.booking_number}&token=${booking.verification_token}`)
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An error occurred')
 } finally {
 setLoading(false)
 }
 }
 return (
 <div className="min-h-screen bg-white p-2 sm:p-4">
 <div className="max-w-6xl mx-auto">
 <div className="flex justify-between items-center mb-4 sm:mb-8">
 <Link href="/" className="text-sm sm:text-base text-primary hover:underline flex items-center gap-2">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
 </svg>
 Back
 </Link>
 <div className="flex items-center gap-3">
 <img src="/logo.png" alt="Dink N' Lob" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
 <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Book a Court</h1>
 </div>
 <div className="w-16 sm:w-28"></div>
 </div>
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
 {error}
 </div>
 )}
 <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
 <div className="mb-6 md:mb-0">
 <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">Select Date & Time</h2>
 <Calendar onDateSelect={setSelectedDate} selectedDate={selectedDate} />
 {selectedDate && (
 <div className="mt-4">
 <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">
 Available Time Slots
 </h3>
 {timeSlots.length > 0 ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
 {timeSlots.map((slot) => (
 <button
 key={slot.time}
 onClick={() => slot.available && setSelectedTime(slot.time)}
 disabled={!slot.available}
 className={`
 px-3 sm:px-4 py-2 text-sm sm:text-base border rounded transition
 ${!slot.available
 ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
 : selectedTime === slot.time
 ? 'bg-primary border-primary text-white'
 : 'bg-white border-gray-300 text-gray-900 hover:bg-primary/10 hover:border-primary'
 }
 `}
 >
 {slot.time}
 </button>
 ))}
 </div>
 ) : (
 <p className="text-sm text-gray-500 ">Loading time slots...</p>
 )}
 </div>
 )}
 </div>
 <div>
 <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">Your Information</h2>
 <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1 text-gray-700">Court</label>
 <select
 value={selectedCourtId}
 onChange={(e) => setSelectedCourtId(e.target.value)}
 className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
 required
 disabled={courtsLoading}
 >
 {courtsLoading ? (
 <option value="">Loading courts...</option>
 ) : courts.length === 0 ? (
 <option value="">No courts available</option>
 ) : (
 courts.map((court) => (
 <option key={court.id} value={court.id}>
 {court.name}
 </option>
 ))
 )}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium mb-1 text-gray-700 ">Full Name</label>
 <input
 type="text"
 value={formData.customer_name}
 onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
 className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
 placeholder="Juan Dela Cruz"
 required
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1 text-gray-700 ">Email</label>
 <input
 type="email"
 value={formData.customer_email}
 onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
 className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
 placeholder="juan@example.com"
 required
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1 text-gray-700 ">Phone Number</label>
 <input
 type="tel"
 value={formData.customer_phone}
 onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
 className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
 placeholder="09123456789 or +639123456789"
 pattern="^(09\d{9}|\+639\d{9})$"
 title="Please enter a valid Philippine phone number (09XXXXXXXXX or +639XXXXXXXXX)"
 maxLength={13}
 required
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1 text-gray-700 ">Notes (Optional)</label>
 <textarea
 value={formData.notes}
 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
 className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
 rows={3}
 placeholder="Any special requests?"
 ></textarea>
 </div>
 <div className="border-t pt-4">
 <h3 className="font-semibold mb-2 text-gray-900">Payment Details</h3>
 <div className="mb-3">
 <label className="block text-sm font-medium mb-1 text-gray-700 ">E-Wallet</label>
 <select
 value={paymentMethod}
 onChange={(e) => setPaymentMethod(e.target.value as 'GCASH' | 'MAYA')}
 className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
 >
 <option value="GCASH">GCash</option>
 <option value="MAYA">Maya</option>
 </select>
 </div>
 <div className="bg-gray-100 p-3 sm:p-4 rounded-lg mb-3 text-center">
 <p className="text-xs sm:text-sm text-gray-600 mb-2">Scan QR Code to Pay</p>
 <button
 type="button"
 onClick={() => setQrModalOpen(true)}
 className="w-40 h-40 sm:w-48 sm:h-48 mx-auto rounded flex items-center justify-center overflow-hidden bg-white hover:ring-4 hover:ring-green-500 transition cursor-pointer"
 >
 <Image
 src={paymentMethod === 'GCASH' ? '/qr-codes/qr_gcash.jpg' : '/qr-codes/qr_maya.jpg'}
 alt={`${paymentMethod} QR Code`}
 width={192}
 height={192}
 className="object-contain"
 />
 </button>
 <p className="text-xs text-gray-500 mt-1">Click to enlarge</p>
 <p className="text-base sm:text-lg font-bold text-primary mt-2">₱500.00</p>
 </div>
 <div>
 <label className="block text-sm font-medium mb-1 text-gray-700 ">Payment Reference Code</label>
 <input
 type="text"
 value={formData.reference_code}
 onChange={(e) => setFormData({ ...formData, reference_code: e.target.value })}
 className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
 placeholder="Enter reference number from your e-wallet"
 required
 />
 </div>
 </div>
 <button
 type="submit"
 disabled={loading || !selectedDate || !selectedTime}
 className="w-full bg-primary text-white py-3 sm:py-4 rounded-lg hover:bg-primary/90 transition font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loading ? 'Processing...' : 'Confirm Booking'}
 </button>
 </form>
 </div>
 </div>
 </div>
 <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
 <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Important Notes:</h3>
 <ul className="text-xs sm:text-sm text-gray-700 space-y-1 list-disc list-inside">
 <li>Payment must be completed before booking confirmation</li>
 <li>Please keep your booking number for reference</li>
 <li>Your booking will be verified within 24 hours</li>
 <li>Operating hours: 6:00 AM - 10:00 PM</li>
 </ul>
 </div>
 </div>
 {qrModalOpen && (
 <div
 className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
 onClick={() => setQrModalOpen(false)}
 >
 <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
 <button
 onClick={() => setQrModalOpen(false)}
 className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
 >
 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 <div className="bg-white rounded-lg p-4 sm:p-6">
 <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
 {paymentMethod === 'GCASH' ? 'GCash' : 'Maya'} QR Code
 </h3>
 <div className="flex justify-center">
 <Image
 src={paymentMethod === 'GCASH' ? '/qr-codes/qr_gcash.jpg' : '/qr-codes/qr_maya.jpg'}
 alt={`${paymentMethod} QR Code`}
 width={400}
 height={400}
 className="object-contain"
 />
 </div>
 <p className="text-2xl font-bold text-primary mt-4 text-center">₱500.00</p>
 <p className="text-sm text-gray-600 mt-2 text-center">
 Scan this QR code with your {paymentMethod === 'GCASH' ? 'GCash' : 'Maya'} app
 </p>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
