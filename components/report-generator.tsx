'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Download, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
interface ReportData {
  booking_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  court_name: string
  date: string
  start_time: string
  end_time: string
  status: string
  total_amount: string
  payment_method: string
  reference_code: string
}
interface ReportGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
export function ReportGenerator({ open, onOpenChange }: ReportGeneratorProps) {
  const supabase = createClient()
  const [filterType, setFilterType] = useState<'quick' | 'range' | 'year'>('quick')
  const [quickAction, setQuickAction] = useState('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [filterSummary, setFilterSummary] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['CONFIRMED', 'PENDING_VERIFICATION', 'CANCELLED', 'COMPLETED'])
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]
  const getDateRange = () => {
    const today = new Date()
    let start = ''
    let end = ''
    let summary = ''
    if (filterType === 'quick') {
      switch (quickAction) {
        case 'today':
          start = today.toISOString().split('T')[0]
          end = start
          summary = 'Today'
          break
        case 'week': {
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay())
          start = weekStart.toISOString().split('T')[0]
          end = today.toISOString().split('T')[0]
          summary = 'This Week'
          break
        }
        case 'month':
          start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
          end = today.toISOString().split('T')[0]
          summary = 'This Month'
          break
      }
    } else if (filterType === 'range') {
      start = startDate
      end = endDate
      summary = `${startDate} to ${endDate}`
    } else if (filterType === 'year') {
      if (selectedMonth) {
        start = `${selectedYear}-${selectedMonth}-01`
        const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate()
        end = `${selectedYear}-${selectedMonth}-${lastDay}`
        summary = `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
      } else {
        start = `${selectedYear}-01-01`
        end = `${selectedYear}-12-31`
        summary = `Year ${selectedYear}`
      }
    }
    return { start, end, summary }
  }
  const generateReport = async () => {
    setLoading(true)
    try {
      const { start, end, summary } = getDateRange()
      let query = supabase
        .from('bookings')
        .select(`
          booking_number,
          customer_name,
          customer_email,
          customer_phone,
          date,
          start_time,
          end_time,
          status,
          total_amount,
          court:courts(name),
          payment:payments(payment_method, reference_code)
        `)
        .gte('date', start)
        .lte('date', end)

      if (selectedStatuses.length > 0) {
        query = query.in('status', selectedStatuses)
      }

      const { data, error } = await query
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
      if (error) throw error
      const formattedData: ReportData[] = (data || []).map((booking: any) => ({
        booking_number: booking.booking_number,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        court_name: booking.court?.name || 'N/A',
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        total_amount: booking.total_amount,
        payment_method: booking.payment?.[0]?.payment_method || 'N/A',
        reference_code: booking.payment?.[0]?.reference_code || 'N/A',
      }))
      setReportData(formattedData)

      // Add status info to summary if not all statuses are selected
      let finalSummary = summary
      if (selectedStatuses.length > 0 && selectedStatuses.length < 4) {
        const statusLabels = selectedStatuses.map(s => s.replace('_', ' ')).join(', ')
        finalSummary += ` (Status: ${statusLabels})`
      }

      setFilterSummary(finalSummary)
      setShowPreview(true)
    } catch (error) {
      alert('Failed to generate report')
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
      <Badge variant={variants[status] || 'outline'} className="whitespace-nowrap">
        {status.replace('_', ' ')}
      </Badge>
    )
  }
  const handlePrint = () => {
    window.print()
  }
  const handleDownloadCSV = () => {
    const headers = [
      'Booking #',
      'Customer Name',
      'Email',
      'Phone',
      'Court',
      'Date',
      'Start Time',
      'End Time',
      'Status',
      'Amount',
      'Payment Method',
      'Reference Code',
    ]
    const csvContent = [
      headers.join(','),
      ...reportData.map((row) =>
        [
          row.booking_number,
          `"${row.customer_name}"`,
          row.customer_email,
          `="${row.customer_phone}"`,
          row.court_name,
          `="${row.date}"`,
          row.start_time,
          row.end_time,
          row.status,
          row.total_amount,
          row.payment_method,
          row.reference_code,
        ].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dink-n-lob-report-${filterSummary.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
  const totalRevenue = reportData.reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0)
  return (
    <>
      <Dialog open={open && !showPreview} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>Select filter options to generate your report</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Quick Actions</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={filterType === 'quick' && quickAction === 'today' ? 'default' : 'outline'}
                  onClick={() => {
                    setFilterType('quick')
                    setQuickAction('today')
                    setStartDate('')
                    setEndDate('')
                    setSelectedMonth('')
                  }}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant={filterType === 'quick' && quickAction === 'week' ? 'default' : 'outline'}
                  onClick={() => {
                    setFilterType('quick')
                    setQuickAction('week')
                    setStartDate('')
                    setEndDate('')
                    setSelectedMonth('')
                  }}
                >
                  This Week
                </Button>
                <Button
                  type="button"
                  variant={filterType === 'quick' && quickAction === 'month' ? 'default' : 'outline'}
                  onClick={() => {
                    setFilterType('quick')
                    setQuickAction('month')
                    setStartDate('')
                    setEndDate('')
                    setSelectedMonth('')
                  }}
                >
                  This Month
                </Button>
              </div>
            </div>

            <div className={`space-y-3 border-t pt-4 transition-opacity ${filterType === 'year' ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Filter by Date Range</Label>
                {filterType === 'year' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto py-0 px-2 text-xs"
                    onClick={() => {
                      setFilterType('quick')
                      setStartDate('')
                      setEndDate('')
                    }}
                  >
                    Clear & Enable
                  </Button>
                )}
              </div>
              {filterType === 'year' && (
                <p className="text-xs text-muted-foreground">Year/Month filter is active. Clear it to use date range.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    disabled={filterType === 'year'}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      if (e.target.value && endDate) {
                        setFilterType('range')
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-sm">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    disabled={filterType === 'year'}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      if (startDate && e.target.value) {
                        setFilterType('range')
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={`space-y-3 border-t pt-4 transition-opacity ${filterType === 'range' ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Filter by Year/Month</Label>
                {filterType === 'range' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto py-0 px-2 text-xs"
                    onClick={() => {
                      setFilterType('quick')
                      setSelectedMonth('')
                    }}
                  >
                    Clear & Enable
                  </Button>
                )}
              </div>
              {filterType === 'range' && (
                <p className="text-xs text-muted-foreground">Date range filter is active. Clear it to use year/month.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="year-select" className="text-sm">Filter by Year</Label>
                  <Select
                    value={selectedYear}
                    disabled={filterType === 'range'}
                    onValueChange={(value) => {
                      setSelectedYear(value)
                      setFilterType('year')
                    }}
                  >
                    <SelectTrigger id="year-select" disabled={filterType === 'range'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month-select" className="text-sm">Filter by Month (Optional)</Label>
                  <Select
                    value={selectedMonth || 'all'}
                    disabled={filterType === 'range'}
                    onValueChange={(value) => {
                      setSelectedMonth(value === 'all' ? '' : value)
                      if (selectedYear) {
                        setFilterType('year')
                      }
                    }}
                  >
                    <SelectTrigger id="month-select" disabled={filterType === 'range'}>
                      <SelectValue placeholder="All months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All months</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-semibold">Filter by Status</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'CONFIRMED', label: 'Confirmed' },
                  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                  { value: 'COMPLETED', label: 'Completed' },
                ].map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={status.value}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStatuses([...selectedStatuses, status.value])
                        } else {
                          setSelectedStatuses(selectedStatuses.filter((s) => s !== status.value))
                        }
                      }}
                    />
                    <Label htmlFor={status.value} className="text-sm font-normal cursor-pointer">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col print:!block print:!overflow-visible print:!max-w-none print:!max-h-none print:!h-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Preview - {filterSummary}
            </DialogTitle>
            <DialogDescription>
              {reportData.length} booking(s) found | Total Revenue: ₱{totalRevenue.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto" id="report-content">
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #report-content,
                #report-content * {
                  visibility: visible !important;
                }
                #report-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
              }
            `}</style>

            <div className="hidden print:block mb-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-1">Dink N' Lob</h1>
                <p className="text-sm text-gray-600">D'HIVE Arcade, Inayawan</p>
                <p className="text-sm font-semibold text-gray-800 mt-3">Bookings Report - {filterSummary}</p>
                <p className="text-xs text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                <p className="text-xs text-gray-500">Total: {reportData.length} booking(s) | Revenue: ₱{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
            {reportData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground print:hidden">
                No bookings found for the selected period.
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Court</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((booking) => (
                      <TableRow key={booking.booking_number}>
                        <TableCell className="font-medium">{booking.booking_number}</TableCell>
                        <TableCell>
                          <div>{booking.customer_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{booking.customer_email}</div>
                          <div className="text-sm text-muted-foreground">{booking.customer_phone}</div>
                        </TableCell>
                        <TableCell>{booking.court_name}</TableCell>
                        <TableCell>{booking.date}</TableCell>
                        <TableCell>
                          {booking.start_time} - {booking.end_time}
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell className="font-semibold">₱{booking.total_amount}</TableCell>
                        <TableCell>
                          <div className="text-sm">{booking.payment_method}</div>
                          <div className="text-xs text-muted-foreground">{booking.reference_code}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="hidden print:block mt-6 pt-3 border-t border-gray-400">
              <div className="flex justify-between text-sm font-semibold">
                <span>Total Bookings: {reportData.length}</span>
                <span>Total Revenue: ₱{totalRevenue.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500 text-center mt-3">
                <p>Thank you for using Dink N' Lob booking system</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t print:hidden">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={handleDownloadCSV} disabled={reportData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            {/* <Button onClick={handlePrint} disabled={reportData.length === 0}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button> */}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
