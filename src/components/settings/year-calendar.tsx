'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getYear, setYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface YearCalendarProps {
  holidays: Date[]
  onDateClick: (date: Date) => void
  type: 'BUSINESS_DAYS' | 'RUNNING_DAYS'
}

export function YearCalendar({ holidays, onDateClick, type }: YearCalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Gerar meses do ano
  const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm border">
         <Button variant="ghost" size="icon" onClick={() => setCurrentYear(y => y - 1)}>
            <ChevronLeft className="w-4 h-4" />
         </Button>
         <div className="font-bold text-lg">{currentYear}</div>
         <Button variant="ghost" size="icon" onClick={() => setCurrentYear(y => y + 1)}>
            <ChevronRight className="w-4 h-4" />
         </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month) => (
          <MonthGrid 
            key={month.toString()} 
            month={month} 
            holidays={holidays} 
            onDateClick={onDateClick}
            type={type}
          />
        ))}
      </div>
    </div>
  )
}

function MonthGrid({ month, holidays, onDateClick, type }: { 
  month: Date
  holidays: Date[] 
  onDateClick: (date: Date) => void
  type: 'BUSINESS_DAYS' | 'RUNNING_DAYS'
}) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }) // Domingo
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const dateFormat = "d"
  const rows = []
  let days = []
  let day = startDate
  let formattedDate = ""

  // Fix: loop needs to be safer or controlled
  const dates = eachDayOfInterval({ start: startDate, end: endDate })

  // Chunk dates into weeks (7 days)
  const weeks = []
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7))
  }

  return (
    <div className="bg-white border rounded shadow-sm p-3">
      <div className="text-center font-semibold mb-2 text-sm capitalize text-gray-700">
        {format(month, 'MMMM', { locale: ptBR })}
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1 text-[10px] text-gray-500 font-medium text-center">
         <div>D</div>
         <div>S</div>
         <div>T</div>
         <div>Q</div>
         <div>Q</div>
         <div>S</div>
         <div>S</div>
      </div>
      <div className="space-y-1">
        {weeks.map((week, idx) => (
            <div key={idx} className="grid grid-cols-7 gap-1">
                {week.map((d) => {
                    const isHoliday = holidays.some(h => isSameDay(h, d))
                    const isWeekend = (d.getDay() === 0 || d.getDay() === 6)
                    const isNonBusiness = type === 'BUSINESS_DAYS' && isWeekend
                    
                    let bgClass = "bg-white"
                    let textClass = "text-gray-700"

                    if (!isSameMonth(d, monthStart)) {
                        textClass = "text-gray-300"
                    } else {
                        if (isHoliday) {
                            bgClass = "bg-red-100"
                            textClass = "text-red-700 font-bold"
                        } else if (isNonBusiness) {
                            bgClass = "bg-gray-100"
                            textClass = "text-gray-500"
                        }
                    }

                    return (
                        <div
                          key={d.toISOString()}
                          className={cn(
                            "h-8 flex items-center justify-center text-xs cursor-pointer hover:bg-gray-200 transition-colors rounded-sm",
                            bgClass,
                            textClass
                          )}
                          onClick={() => {
                              if (isSameMonth(d, monthStart)) {
                                  onDateClick(d)
                              }
                          }}
                        >
                          {format(d, 'd')}
                        </div>
                    )
                })}
            </div>
        ))}
      </div>
    </div>
  )
}
