import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function GET() {
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
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
    const { count: pendingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING_VERIFICATION')
    const { count: confirmedCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CONFIRMED')
    const { data: confirmedBookings } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('status', 'CONFIRMED')
    const totalRevenue = confirmedBookings?.reduce(
      (sum, booking) => sum + parseFloat(booking.total_amount.toString()),
      0
    ) || 0
    return NextResponse.json({
      totalBookings: totalBookings || 0,
      pendingVerification: pendingCount || 0,
      confirmed: confirmedCount || 0,
      totalRevenue: totalRevenue.toFixed(2),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
