'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Calendar, BarChart3, Clock, Menu, X } from 'lucide-react'
import { Button } from './button'
import { useState } from 'react'
interface SidebarProps {
  adminName?: string
  onSignOut?: () => void
}
export function Sidebar({ adminName, onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { name: 'Reports', href: '/admin/reports', icon: Clock },
  ]
  const SidebarContent = () => (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center px-6 py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Dink N' Lob"
              className="w-10 h-10 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight">Dink N' Lob</span>
              <span className="text-xs text-muted-foreground">Admin Portal</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex flex-col gap-3">
            {adminName && (
              <div className="px-4 py-2">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium truncate">{adminName}</p>
              </div>
            )}
            {onSignOut && (
              <Button
                variant="outline"
                onClick={onSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40 transform transition-transform duration-200',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border">
        <SidebarContent />
      </aside>
    </>
  )
}
