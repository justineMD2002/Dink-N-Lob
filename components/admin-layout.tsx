'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './ui/sidebar'
interface AdminLayoutProps {
  children: React.ReactNode
}
export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)
  const isLoginPage = pathname === '/admin/login'
  useEffect(() => {
    if (!isLoginPage) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [pathname])
  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (!adminData) {
      router.push('/admin/login')
      return
    }
    setAdminName(adminData.name)
    setLoading(false)
  }
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }
  if (loading && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }
  if (isLoginPage) {
    return <>{children}</>
  }
  return (
    <div className="min-h-screen bg-background">
      <Sidebar adminName={adminName} onSignOut={handleSignOut} />
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">{children}</div>
      </main>
    </div>
  )
}
