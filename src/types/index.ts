export interface Event {
  id: string;
  title: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  description: string;
  color: string;
  recurrence: RecurrencePattern | null;
  isRecurring: boolean;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday to Saturday (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  endDate?: string; // ISO date string
  occurrences?: number; // Number of occurrences
}