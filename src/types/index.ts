export interface Event {
  id: string;
  title: string;
  startDate: string; 
  endDate: string; 
  description: string;
  color: string;
  category: 'work' | 'personal' | 'meeting' | 'other';
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
  interval: number; 
  daysOfWeek?: number[]; 
  dayOfMonth?: number; 
  endDate?: string; 
  occurrences?: number; 
}

export type EventCategory = 'work' | 'personal' | 'meeting' | 'other';