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
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(
          *,
          court:courts(name)
        )
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching pending payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
