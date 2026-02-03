'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Eye, Check, X } from 'lucide-react'
interface Payment {
  id: string
  payment_method: string
  reference_code: string
  status: string
}

interface Booking {
  id: string
  booking_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  date: string
  start_time: string
  end_time: string
  status: string
  total_amount: string
  notes: string | null
  court: { name: string }
  payment: Payment | Payment[]
}
export default function BookingsPage() {
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [bookingToReject, setBookingToReject] = useState<Booking | null>(null)
  useEffect(() => {
    fetchBookings()

    const supabase = createClient()

    // Subscribe to bookings changes
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          fetchBookings()
        }
      )
      .subscribe()

    // Subscribe to payments changes
    const paymentsChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          fetchBookings()
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(bookingsChannel)
      supabase.removeChannel(paymentsChannel)
    }
  }, [])
  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/recent-bookings?limit=50')
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch bookings',
      })
    } finally {
      setLoading(false)
    }
  }
  const handleView = (booking: Booking) => {
    setSelectedBooking(booking)
    setSheetOpen(true)
  }
  const handleConfirm = async (booking: Booking) => {
    if (!booking || !booking.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid booking data.',
      })
      return
    }

    const payment = Array.isArray(booking.payment)
      ? booking.payment[0]
      : booking.payment

    if (!payment || !payment.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No payment record found. Please ensure the customer has submitted payment details.',
      })
      return
    }

    setActionLoading(booking.id)
    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          approved: true,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: 'Booking confirmed successfully',
          className: 'bg-green-50 border-green-200 text-green-900',
        })
        fetchBookings()
        setSheetOpen(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to confirm booking')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to confirm booking',
      })
    } finally {
      setActionLoading(null)
    }
  }
  const handleReject = (booking: Booking) => {
    if (!booking || !booking.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid booking data.',
      })
      return
    }

    const payment = Array.isArray(booking.payment)
      ? booking.payment[0]
      : booking.payment

    if (!payment || !payment.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No payment record found. Please ensure the customer has submitted payment details.',
      })
      return
    }
    setBookingToReject(booking)
    setRejectionReason('')
    setRejectModalOpen(true)
  }
  const handleRejectSubmit = async () => {
    if (!bookingToReject || !bookingToReject.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid booking data.',
      })
      setRejectModalOpen(false)
      return
    }

    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a rejection reason',
      })
      return
    }

    const payment = Array.isArray(bookingToReject.payment)
      ? bookingToReject.payment[0]
      : bookingToReject.payment

    if (!payment || !payment.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No payment record found for this booking.',
      })
      setRejectModalOpen(false)
      return
    }

    setActionLoading(bookingToReject.id)
    setRejectModalOpen(false)
    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          approved: false,
          rejectionReason: rejectionReason.trim(),
        }),
      })
      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: 'Booking rejected successfully',
          className: 'bg-green-50 border-green-200 text-green-900',
        })
        fetchBookings()
        setSheetOpen(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject booking')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject booking',
      })
    } finally {
      setActionLoading(null)
      setBookingToReject(null)
      setRejectionReason('')
    }
  }
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
      CONFIRMED: 'success',
      PENDING_VERIFICATION: 'secondary',
      CANCELLED: 'destructive',
      COMPLETED: 'outline',
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Manage Bookings</h1>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No bookings found.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.booking_number}
                    </TableCell>
                    <TableCell>
                      <div>{booking.customer_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.customer_email}
                      </div>
                    </TableCell>
                    <TableCell>{booking.court.name}</TableCell>
                    <TableCell>
                      <div>{booking.date}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.start_time} - {booking.end_time}
                      </div>
                    </TableCell>
                    <TableCell>₱{booking.total_amount}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {booking.status === 'PENDING_VERIFICATION' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(booking)}
                              disabled={actionLoading === booking.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(booking)}
                              disabled={actionLoading === booking.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
            <SheetDescription>
              Booking #{selectedBooking?.booking_number}
            </SheetDescription>
          </SheetHeader>
          {selectedBooking && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedBooking.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedBooking.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{selectedBooking.customer_phone}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Booking Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Court:</span>
                    <span className="font-medium">{selectedBooking.court.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{selectedBooking.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">
                      {selectedBooking.start_time} - {selectedBooking.end_time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">₱{selectedBooking.total_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                  {selectedBooking.notes && (
                    <div>
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="mt-1 text-sm">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              {(() => {
                const payment = Array.isArray(selectedBooking.payment)
                  ? selectedBooking.payment[0]
                  : selectedBooking.payment
                return payment && (
                  <div>
                    <h3 className="font-semibold mb-3">Payment Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="font-medium">
                          {payment.payment_method}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference:</span>
                        <span className="font-medium">
                          {payment.reference_code}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  </div>
                )
              })()}
              {selectedBooking.status === 'PENDING_VERIFICATION' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleConfirm(selectedBooking)}
                    disabled={actionLoading === selectedBooking.id}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => handleReject(selectedBooking)}
                    disabled={actionLoading === selectedBooking.id}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this booking. The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false)
                setRejectionReason('')
                setBookingToReject(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim()}
            >
              Reject Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
