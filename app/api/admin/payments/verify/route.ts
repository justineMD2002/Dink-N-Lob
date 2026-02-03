import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { csrfProtection } from '@/lib/csrf'
import { z } from 'zod'

const verifyPaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  approved: z.boolean(),
  rejectionReason: z.string().max(500).optional()
}).refine((data) => {
  // If rejected, rejection reason is required
  if (!data.approved && !data.rejectionReason) {
    return false
  }
  return true
}, {
  message: 'Rejection reason is required when rejecting a payment',
  path: ['rejectionReason']
})

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const csrfError = csrfProtection(request)
    if (csrfError) return csrfError

    // Verify admin authentication
    const authResult = await verifyAdminAuth()
    if (!authResult.authorized) {
      return authResult.response!
    }

    const adminUser = authResult.user!
    const body = await request.json()

    // Validate input
    const validatedData = verifyPaymentSchema.parse(body)
    const { paymentId, approved, rejectionReason } = validatedData

    const supabase = await createClient()

    if (approved) {
      // Approve payment
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'VERIFIED',
          verified_at: new Date().toISOString(),
          verified_by: adminUser.user_id,
        })
        .eq('id', paymentId)
        .eq('status', 'PENDING') // Only update if still pending

      if (paymentError) {
        console.error('Error verifying payment:', paymentError.code)
        return NextResponse.json(
          { error: 'Unable to verify payment' },
          { status: 500 }
        )
      }

      // Get booking ID and update booking status
      const { data: payment } = await supabase
        .from('payments')
        .select('booking_id')
        .eq('id', paymentId)
        .single()

      if (payment) {
        await supabase
          .from('bookings')
          .update({ status: 'CONFIRMED' })
          .eq('id', payment.booking_id)
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully'
      })

    } else {
      // Reject payment
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'REJECTED',
          rejection_reason: rejectionReason,
          verified_by: adminUser.user_id,
        })
        .eq('id', paymentId)
        .eq('status', 'PENDING') // Only update if still pending

      if (paymentError) {
        console.error('Error rejecting payment:', paymentError.code)
        return NextResponse.json(
          { error: 'Unable to reject payment' },
          { status: 500 }
        )
      }

      // Get booking ID and update booking status
      const { data: payment } = await supabase
        .from('payments')
        .select('booking_id')
        .eq('id', paymentId)
        .single()

      if (payment) {
        await supabase
          .from('bookings')
          .update({ status: 'CANCELLED' })
          .eq('id', payment.booking_id)
      }

      return NextResponse.json({
        success: true,
        message: 'Payment rejected successfully'
      })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Unexpected error in payment verification:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
