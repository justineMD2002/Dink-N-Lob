'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar, DollarSign, Clock, CheckCircle, BarChart3 } from 'lucide-react'
interface Stats {
  totalBookings: number
  pendingVerification: number
  confirmed: number
  totalRevenue: string
}
interface Booking {
  id: string
  booking_number: string
  customer_name: string
  customer_email: string
  date: string
  start_time: string
  status: string
  total_amount: string
  court: { name: string }
  payment: Array<{ payment_method: string; status: string }>
}
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingVerification: 0,
    confirmed: 0,
    totalRevenue: '0',
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetchStats()
    fetchRecentBookings()
  }, [])
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }
  const fetchRecentBookings = async () => {
    try {
      const response = await fetch('/api/admin/recent-bookings?limit=5')
      if (response.ok) {
        const data = await response.json()
        setRecentBookings(data)
      }
    } catch (error) {
      console.error('Error fetching recent bookings:', error)
    } finally {
      setLoading(false)
    }
  }
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      CONFIRMED: 'default',
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
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">All bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingVerification}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmed}</div>
              <p className="text-xs text-muted-foreground">Verified bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">From confirmed bookings</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest 5 bookings from customers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No bookings yet. They will appear here once customers start booking.
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((booking) => (
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
                            {booking.start_time}
                          </div>
                        </TableCell>
                        <TableCell>₱{booking.total_amount}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
