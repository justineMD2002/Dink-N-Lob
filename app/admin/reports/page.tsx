'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar, DollarSign, Users, FileText } from 'lucide-react'
import { ReportGenerator } from '@/components/report-generator'
interface ReportStats {
  totalBookings: number
  totalRevenue: string
  averageBookingValue: string
  topCourt: string
  topPaymentMethod: string
  statusBreakdown: Record<string, number>
  revenueByMonth: Array<{ month: string; revenue: number }>
  bookingsByDay: Array<{ day: string; count: number }>
}
export default function ReportsPage() {
  const supabase = createClient()
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)
  const [reportGeneratorOpen, setReportGeneratorOpen] = useState(false)
  const [stats, setStats] = useState<ReportStats>({
    totalBookings: 0,
    totalRevenue: '0',
    averageBookingValue: '0',
    topCourt: 'N/A',
    topPaymentMethod: 'N/A',
    statusBreakdown: {},
    revenueByMonth: [],
    bookingsByDay: [],
  })
  useEffect(() => {
    fetchReportData()
  }, [period])
  const fetchReportData = async () => {
    try {
      setLoading(true)
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          court:courts(name),
          payment:payments(payment_method, amount)
        `)
      if (error) throw error
      const totalBookings = bookings?.length || 0
      const confirmedBookings = bookings?.filter((b) => b.status === 'CONFIRMED') || []
      const totalRevenue = confirmedBookings.reduce(
        (sum, booking) => sum + parseFloat(booking.total_amount.toString()),
        0
      )
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
      const courtCounts: Record<string, number> = {}
      bookings?.forEach((booking) => {
        const courtName = booking.court?.name || 'Unknown'
        courtCounts[courtName] = (courtCounts[courtName] || 0) + 1
      })
      const topCourt = Object.entries(courtCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
      const paymentCounts: Record<string, number> = {}
      bookings?.forEach((booking) => {
        const method = booking.payment?.[0]?.payment_method || 'Unknown'
        paymentCounts[method] = (paymentCounts[method] || 0) + 1
      })
      const topPaymentMethod = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
      const statusBreakdown: Record<string, number> = {}
      bookings?.forEach((booking) => {
        statusBreakdown[booking.status] = (statusBreakdown[booking.status] || 0) + 1
      })
      const monthlyRevenue: Record<string, number> = {}
      confirmedBookings.forEach((booking) => {
        const month = new Date(booking.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(booking.total_amount.toString())
      })
      const revenueByMonth = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue,
      }))
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const dayCounts: Record<string, number> = {}
      bookings?.forEach((booking) => {
        const day = dayNames[new Date(booking.date).getDay()]
        dayCounts[day] = (dayCounts[day] || 0) + 1
      })
      const bookingsByDay = Object.entries(dayCounts).map(([day, count]) => ({ day, count }))
      setStats({
        totalBookings,
        totalRevenue: totalRevenue.toFixed(2),
        averageBookingValue: averageBookingValue.toFixed(2),
        topCourt,
        topPaymentMethod,
        statusBreakdown,
        revenueByMonth,
        bookingsByDay,
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setReportGeneratorOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="today">Today</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading reports...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">All time bookings</p>
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₱{stats.averageBookingValue}</div>
                  <p className="text-xs text-muted-foreground">Per booking</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Court</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.topCourt}</div>
                  <p className="text-xs text-muted-foreground">Most booked</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Breakdown</CardTitle>
                <CardDescription>Distribution of bookings by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2">
                      <Badge variant="outline">{status.replace('_', ' ')}</Badge>
                      <span className="text-2xl font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Month</CardTitle>
                <CardDescription>Monthly revenue from confirmed bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.revenueByMonth.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No revenue data available</p>
                ) : (
                  <div className="space-y-2">
                    {stats.revenueByMonth.map(({ month, revenue }) => (
                      <div key={month} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{month}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-primary rounded-full" style={{ width: `${(revenue / Math.max(...stats.revenueByMonth.map(r => r.revenue))) * 200}px` }} />
                          <span className="text-sm font-bold min-w-[80px] text-right">₱{revenue.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bookings by Day of Week</CardTitle>
                <CardDescription>Which days are most popular</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.bookingsByDay.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No booking data available</p>
                ) : (
                  <div className="space-y-2">
                    {stats.bookingsByDay.map(({ day, count }) => (
                      <div key={day} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{day}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-secondary rounded-full" style={{ width: `${(count / Math.max(...stats.bookingsByDay.map(d => d.count))) * 200}px` }} />
                          <span className="text-sm font-bold min-w-[40px] text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Additional Insights</CardTitle>
                <CardDescription>Key metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Most Popular Payment Method</h4>
                    <Badge className="text-lg">{stats.topPaymentMethod}</Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Booking Statuses</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                        <Badge key={status} variant="secondary">
                          {status.replace('_', ' ')}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <ReportGenerator open={reportGeneratorOpen} onOpenChange={setReportGeneratorOpen} />
    </div>
  )
}
