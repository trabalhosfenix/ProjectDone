import { addDays, isWeekend, isSameDay, startOfDay, differenceInDays } from 'date-fns'

export type CalendarType = 'BUSINESS_DAYS' | 'RUNNING_DAYS'

export interface CalendarHoliday {
  date: Date | string
  isRecurring?: boolean // If true, matches day/month every year
}

export interface WorkCalendarConfig {
  type: CalendarType
  holidays: CalendarHoliday[]
  workHoursPerDay?: number
}

// Check if a specific date is a holiday
export function isHoliday(date: Date, holidays: CalendarHoliday[]): boolean {
  return holidays.some(h => {
    const holidayDate = new Date(h.date)
    if (h.isRecurring) {
      return holidayDate.getDate() === date.getDate() && holidayDate.getMonth() === date.getMonth()
    }
    return isSameDay(holidayDate, date)
  })
}

// Check if a date is a working day based on calendar config
export function isWorkingDay(date: Date, config: WorkCalendarConfig): boolean {
  // 1. Check Weekend
  if (config.type === 'BUSINESS_DAYS' && isWeekend(date)) {
    return false
  }
  
  // 2. Check Holiday
  if (isHoliday(date, config.holidays)) {
    return false
  }

  return true
}

/**
 * Calculates the End Date given a Start Date and Duration (in days).
 * Duration 1 day = End Date is same as Start Date (if Start is working).
 * Standard Project Logic:
 * Start: Mon, Duration: 1 -> End: Mon
 * Start: Mon, Duration: 2 -> End: Tue
 * 
 * If Start is non-working, should we jump to next working first?
 * Usually yes. "Start" implies task is ready to start. If it's Sunday, it starts Monday.
 */
export function calculateEndDate(startDate: Date, durationDays: number, config: WorkCalendarConfig): Date {
  let currentDate = startOfDay(new Date(startDate))
  let remainingDuration = Math.max(0, durationDays)
  
  // If duration is 0, return start date (milestone)
  if (remainingDuration === 0) return currentDate

  // If Start Date is non-working, find next working day
  while (!isWorkingDay(currentDate, config)) {
    currentDate = addDays(currentDate, 1)
  }

  // Iterate to consume duration
  // Duration of "1 day" means we consume the current day.
  // So we decrement duration AFTER consuming today, but if duration is 1, we stop AT today.
  // So loop while remaining > 1?
  
  // Logic: 
  // Day 1: Mon (Working) -> Consumed. Remaining: 0? 
  // Implement step-by-step
  
  // Actually, we usually add (Duration - 1) working days to Start Date.
  // Exception: Duration < 1 (partial)? logic engine usually handles integers.
  
  let daysToAdd = Math.ceil(remainingDuration) - 1
  
  // If duration is e.g. 0.5, we treat as 1 day for date calc if we don't handle hours.
  if (daysToAdd < 0) daysToAdd = 0 
  
  while (daysToAdd > 0) {
    currentDate = addDays(currentDate, 1)
    if (isWorkingDay(currentDate, config)) {
      daysToAdd--
    }
  }

  return currentDate
}

/**
 * Calculates Duration (in days) between Start and End dates.
 * Inclusive of Start and End.
 * Start: Mon, End: Mon -> Duration: 1
 */
export function calculateDuration(startDate: Date, endDate: Date, config: WorkCalendarConfig): number {
  let start = startOfDay(new Date(startDate))
  let end = startOfDay(new Date(endDate))
  
  if (start > end) return 0
  
  let duration = 0
  let current = start
  
  // Iterate from Start to End
  while (current <= end) {
    if (isWorkingDay(current, config)) {
      duration++
    }
    current = addDays(current, 1)
  }
  
  return duration
}
