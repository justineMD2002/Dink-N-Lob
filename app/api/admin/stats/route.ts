import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authResult = await verifyAdminAuth()
  if (!authResult.authorized) {
    return authResult.response!
  }

  try {
    const supabase = await createClient()

    const { count: totalBookings, error: totalError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    const { count: pendingCount, error: pendingError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING_VERIFICATION')

    const { count: confirmedCount, error: confirmedError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CONFIRMED')

    const { count: cancelledCount, error: cancelledError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CANCELLED')

    if (totalError || pendingError || confirmedError || cancelledError) {
      console.error('Error fetching stats')
      return NextResponse.json(
        { error: 'Unable to fetch statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      totalBookings: totalBookings || 0,
      pendingVerification: pendingCount || 0,
      confirmed: confirmedCount || 0,
      cancelled: cancelledCount || 0,
    })
  } catch (error) {
    console.error('Unexpected error fetching stats:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
