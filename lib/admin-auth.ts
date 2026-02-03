import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export interface AdminUser {
  id: string
  user_id: string
  name: string
}

export async function verifyAdminAuth(): Promise<{
  authorized: boolean
  user?: AdminUser
  response?: NextResponse
}> {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }
  }

  // Check if user is an admin
  const { data: adminData, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (adminError || !adminData) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
  }

  return {
    authorized: true,
    user: adminData
  }
}
