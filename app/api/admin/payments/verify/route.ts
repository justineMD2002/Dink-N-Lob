import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!adminData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { paymentId, approved, rejectionReason } = body
    if (approved) {
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'VERIFIED',
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .eq('id', paymentId)
      if (paymentError) {
        return NextResponse.json({ error: paymentError.message }, { status: 500 })
      }
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
      return NextResponse.json({ success: true, message: 'Payment verified' })
    } else {
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'REJECTED',
          rejection_reason: rejectionReason,
          verified_by: user.id,
        })
        .eq('id', paymentId)
      if (paymentError) {
        return NextResponse.json({ error: paymentError.message }, { status: 500 })
      }
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
      return NextResponse.json({ success: true, message: 'Payment rejected' })
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
