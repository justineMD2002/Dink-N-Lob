'use client'
import { useState } from 'react'
interface CalendarProps {
  onDateSelect: (date: string) => void
  selectedDate: string | null
}
export default function Calendar({ onDateSelect, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    return { daysInMonth, startingDayOfWeek, year, month }
  }
  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    const selectedDateObj = new Date(year, month, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDateObj >= today) {
      onDateSelect(dateStr)
    }
  }
  const isDateSelected = (day: number) => {
    if (!selectedDate) return false
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    return dateStr === selectedDate
  }
  const isDatePast = (day: number) => {
    const dateObj = new Date(year, month, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dateObj < today
  }
  const renderDays = () => {
    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const isPast = isDatePast(day)
      const isSelected = isDateSelected(day)
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isPast}
          className={`
            p-2 sm:p-3 text-sm sm:text-base rounded-lg transition
            ${isPast
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'hover:bg-primary/10 cursor-pointer text-gray-900'
            }
            ${isSelected
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-white'
            }
            border border-gray-200
          `}
        >
          {day}
        </button>
      )
    }
    return days
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {renderDays()}
      </div>
      <div className="mt-4 text-xs text-gray-500 text-center">
        Select a date to view available time slots
      </div>
    </div>
  )
}
