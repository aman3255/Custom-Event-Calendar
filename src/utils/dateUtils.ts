import { CalendarDay, Event, RecurrencePattern } from "../types";

// Get days in month
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

// Get day of week (0-6, where 0 is Sunday)
export const getDayOfWeek = (year: number, month: number, day: number): number => {
  return new Date(year, month, day).getDay();
};

// Get first day of month (0-6, where 0 is Sunday)
export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

// Format date to display in the UI (e.g., "Jan 1, 2023")
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Format time to display in the UI (e.g., "10:30 AM")
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Get days for calendar grid (including days from previous and next months)
export const getCalendarDays = (
  year: number,
  month: number,
  events: Event[]
): CalendarDay[] => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  
  // Get days from previous month to fill the first row
  const daysFromPrevMonth = firstDayOfMonth;
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
  
  // Get days for next month to fill the last row
  const totalDaysToShow = 42; // 6 rows of 7 days
  const daysFromNextMonth = totalDaysToShow - daysInMonth - daysFromPrevMonth;
  
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const calendarDays: CalendarDay[] = [];
  
  // Add days from previous month
  for (let i = 0; i < daysFromPrevMonth; i++) {
    const day = daysInPrevMonth - daysFromPrevMonth + i + 1;
    const date = new Date(prevMonthYear, prevMonth, day);
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(date, events),
    });
  }
  
  // Add days from current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    calendarDays.push({
      date,
      isCurrentMonth: true,
      isToday:
        i === currentDay && month === currentMonth && year === currentYear,
      events: getEventsForDate(date, events),
    });
  }
  
  // Add days from next month
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextMonthYear = month === 11 ? year + 1 : year;
  
  for (let i = 1; i <= daysFromNextMonth; i++) {
    const date = new Date(nextMonthYear, nextMonth, i);
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(date, events),
    });
  }
  
  return calendarDays;
};

// Get formatted month and year (e.g., "January 2023")
export const getFormattedMonthYear = (year: number, month: number): string => {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

// Check if an event occurs on a specific date
export const doesEventOccurOnDate = (event: Event, date: Date): boolean => {
  // For non-recurring events, simply check if the event's date matches
  if (!event.isRecurring || !event.recurrence) {
    const eventStart = new Date(event.startDate);
    return (
      eventStart.getFullYear() === date.getFullYear() &&
      eventStart.getMonth() === date.getMonth() &&
      eventStart.getDate() === date.getDate()
    );
  }

  // For recurring events, check if the event recurs on this date
  return doesRecurringEventOccurOnDate(event, date);
};

// Check if a recurring event occurs on a specific date
export const doesRecurringEventOccurOnDate = (
  event: Event,
  date: Date
): boolean => {
  if (!event.recurrence) return false;

  const recurrence = event.recurrence;
  const eventStart = new Date(event.startDate);
  const eventEnd = event.recurrence.endDate ? new Date(event.recurrence.endDate) : null;

  // If the event end date exists and the current date is after it, the event doesn't occur
  if (eventEnd && date > eventEnd) return false;

  // If the current date is before the event start date, the event doesn't occur yet
  if (date < eventStart) return false;

  // Check based on recurrence type
  switch (recurrence.type) {
    case 'daily':
      return isDailyRecurrence(eventStart, date, recurrence);
    case 'weekly':
      return isWeeklyRecurrence(eventStart, date, recurrence);
    case 'monthly':
      return isMonthlyRecurrence(eventStart, date, recurrence);
    case 'custom':
      return isCustomRecurrence(eventStart, date, recurrence);
    default:
      return false;
  }
};

// Check if a date falls within a daily recurrence pattern
const isDailyRecurrence = (
  start: Date,
  date: Date,
  recurrence: RecurrencePattern
): boolean => {
  const diffTime = Math.abs(date.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays % recurrence.interval === 0;
};

// Check if a date falls within a weekly recurrence pattern
const isWeeklyRecurrence = (
  start: Date,
  date: Date,
  recurrence: RecurrencePattern
): boolean => {
  // Check if the weeks align based on the interval
  const diffTime = Math.abs(date.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  
  if (diffWeeks % recurrence.interval !== 0) return false;
  
  // Check if the day of the week is included
  const dayOfWeek = date.getDay();
  return recurrence.daysOfWeek?.includes(dayOfWeek) || false;
};

// Check if a date falls within a monthly recurrence pattern
const isMonthlyRecurrence = (
  start: Date,
  date: Date,
  recurrence: RecurrencePattern
): boolean => {
  // Check if the months align based on the interval
  const monthDiff =
    (date.getFullYear() - start.getFullYear()) * 12 +
    (date.getMonth() - start.getMonth());
  
  if (monthDiff % recurrence.interval !== 0) return false;
  
  // Check if it's the same day of the month
  return date.getDate() === (recurrence.dayOfMonth || start.getDate());
};

// Check if a date falls within a custom recurrence pattern
const isCustomRecurrence = (
  start: Date,
  date: Date,
  recurrence: RecurrencePattern
): boolean => {
  // For simplicity, we'll treat custom as a daily recurrence with a custom interval
  const diffTime = Math.abs(date.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays % recurrence.interval === 0;
};

// Get all events for a specific date
export const getEventsForDate = (date: Date, events: Event[]): Event[] => {
  return events.filter(event => doesEventOccurOnDate(event, date));
};

// Check if two events overlap in time
export const doEventsOverlap = (event1: Event, event2: Event): boolean => {
  const event1Start = new Date(event1.startDate);
  const event1End = new Date(event1.endDate);
  const event2Start = new Date(event2.startDate);
  const event2End = new Date(event2.endDate);

  // Check if events are on the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // If events are not on the same day, they don't overlap
  if (!isSameDay(event1Start, event2Start)) {
    return false;
  }
  
  return (
    (event1Start <= event2End && event1End >= event2Start) ||
    (event2Start <= event1End && event2End >= event1Start)
  );
};

// Check if an event conflicts with any existing events, including recurring events
export const hasEventConflict = (
  event: Event,
  events: Event[],
  excludeEventId?: string
): boolean => {
  // Get the date range for checking conflicts
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  // Check each existing event for conflicts
  return events.some(existingEvent => {
    // Skip the event being edited
    if (existingEvent.id === excludeEventId) {
      return false;
    }

    // For recurring events, check if any instance conflicts
    if (existingEvent.isRecurring && existingEvent.recurrence) {
      // Check dates within the range
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        if (doesEventOccurOnDate(existingEvent, date) && doEventsOverlap(event, existingEvent)) {
          return true;
        }
      }
      return false;
    }

    // For non-recurring events, simple overlap check
    return doEventsOverlap(event, existingEvent);
  });
};

// Generate a date string in ISO format for a specific date and time
export const generateDateTimeString = (
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0
): string => {
  return new Date(year, month, day, hour, minute).toISOString();
};