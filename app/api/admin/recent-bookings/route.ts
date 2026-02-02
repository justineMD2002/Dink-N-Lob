import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
export async function GET(request: NextRequest) {
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
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '10')
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        court:courts(name),
        payment:payments(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching recent bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
