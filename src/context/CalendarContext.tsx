import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, RecurrencePattern } from '../types';
import { hasEventConflict } from '../utils/dateUtils';

interface CalendarContextType {
  events: Event[];
  addEvent: (event: Event) => { success: boolean; message?: string };
  updateEvent: (event: Event) => { success: boolean; message?: string };
  deleteEvent: (eventId: string) => void;
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  goToToday: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredEvents: Event[];
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

interface CalendarProviderProps {
  children: ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const today = new Date();
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load events from local storage on initial mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (error) {
        console.error('Error parsing saved events:', error);
      }
    }
  }, []);

  // Save events to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  // Move to the next month, handling year change
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Move to the previous month, handling year change
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Go to today's date
  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Add a new event
  const addEvent = (event: Event): { success: boolean; message?: string } => {
    // Check for conflicts with existing events
    if (hasEventConflict(event, events)) {
      return {
        success: false,
        message: 'This event conflicts with an existing event. Please choose a different time.',
      };
    }

    setEvents([...events, event]);
    return { success: true };
  };

  // Update an existing event
  const updateEvent = (event: Event): { success: boolean; message?: string } => {
    // Check for conflicts with other events (excluding the current event)
    if (hasEventConflict(event, events, event.id)) {
      return {
        success: false,
        message: 'This update conflicts with an existing event. Please choose a different time.',
      };
    }

    setEvents(events.map(e => (e.id === event.id ? event : e)));
    return { success: true };
  };

  // Delete an event
  const deleteEvent = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  // Filter events based on search term
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <CalendarContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        currentMonth,
        currentYear,
        setCurrentMonth,
        setCurrentYear,
        nextMonth,
        prevMonth,
        goToToday,
        searchTerm,
        setSearchTerm,
        filteredEvents,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

// Custom hook to use the calendar context
export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};