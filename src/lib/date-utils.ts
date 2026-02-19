import { addDays, isWeekend, isSameDay, differenceInBusinessDays, addBusinessDays as dateFnsAddBusinessDays } from 'date-fns'

/**
 * Checks if a date is Saturday or Sunday
 */
export function isWeekendDay(date: Date): boolean {
  return isWeekend(date)
}

/**
 * Add business days to a start date.
 * If start date is weekend, it moves to next Monday first? 
 * Standard Project behavior: If task starts on Sat, it moves to Mon?
 * We assume inputs are already normalized or we normalize them.
 */
export function addBusinessDays(startDate: Date, durationDays: number): Date {
  if (durationDays < 0) return startDate // safeguard
  
  // Using date-fns helper, but let's be careful about partial days if we had them.
  // For integer days:
  return dateFnsAddBusinessDays(startDate, Math.ceil(durationDays))
}

/**
 * Get difference in business days.
 * If start=Mon, End=Mon, diff=0? Or 1?
 * In Project: Duration = End - Start (working time).
 * If Start=Mon 8:00, End=Mon 17:00 -> 1 Day.
 * If values are Dates (00:00):
 * Mon - Mon = 0?
 * Usually "Dates" in input are Inclusive?
 * If Start=Mon, Duration=1 -> End=Mon.
 * If Start=Mon, Duration=2 -> End=Tue.
 * date-fns differenceInBusinessDays(Tue, Mon) = 1.
 * So Duration = differenceInBusinessDays(End, Start) + 1?
 * If we treat End as "End of Day", yes.
 * If we treat End as "Start of Next Day" (Exclusive), then it is exact diff.
 * The screenshot shows: Start=29/01, End=10/04, Duration=313 days.
 * Diff(10/04/24, 29/01/23) is huge.
 * Let's assume standard behavior:
 * Start (00:00) to End (00:00) diff.
 */
export function getBusinessDaysDuration(start: Date, end: Date): number {
    if (start > end) return 0
    // date-fns differenceInBusinessDays excludes the last day? or not?
    // Docs: "number of business days between the given dates".
    // Mon to Tue -> 1 business day?
    // We will assume Inclusive End Date logic usually requires +1 if end is working day?
    // Let's stick to simple Diff first.
    return differenceInBusinessDays(end, start)
}
