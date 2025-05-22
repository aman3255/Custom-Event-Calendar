import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, EventCategory } from '../types';
import { hasEventConflict } from '../utils/dateUtils';

interface CalendarContextType {
  events: Event[];
  addEvent: (event: Event) => { success: boolean; message?: string };
  updateEvent: (event: Event) => { success: boolean; message?: string };
  deleteEvent: (eventId: string) => void;
  moveEvent: (eventId: string, newDate: Date, moveEntireSeries: boolean) => { success: boolean; message?: string };
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  goToToday: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: EventCategory[];
  toggleCategory: (category: EventCategory) => void;
  filteredEvents: Event[];
  clearAllEvents: () => void;
  exportEvents: () => string;
  importEvents: (jsonData: string) => { success: boolean; message?: string };
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

interface CalendarProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'calendarEvents';
const LAST_SYNC_KEY = 'lastEventSync';

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const today = new Date();
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);

  // Load events from localStorage on initial mount
  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem(STORAGE_KEY);
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        // Validate the data structure
        if (Array.isArray(parsedEvents) && parsedEvents.every(isValidEvent)) {
          setEvents(parsedEvents);
        } else {
          console.error('Invalid event data structure in localStorage');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading events from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save events to localStorage with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      } catch (error) {
        console.error('Error saving events to localStorage:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [events]);

  // Validate event object structure
  const isValidEvent = (event: any): event is Event => {
    return (
      typeof event === 'object' &&
      typeof event.id === 'string' &&
      typeof event.title === 'string' &&
      typeof event.startDate === 'string' &&
      typeof event.endDate === 'string' &&
      typeof event.description === 'string' &&
      typeof event.color === 'string' &&
      typeof event.category === 'string' &&
      typeof event.isRecurring === 'boolean' &&
      (event.recurrence === null || typeof event.recurrence === 'object')
    );
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const addEvent = (event: Event): { success: boolean; message?: string } => {
    if (hasEventConflict(event, events)) {
      return {
        success: false,
        message: 'This event conflicts with an existing event. Please choose a different time.',
      };
    }

    setEvents(prevEvents => [...prevEvents, event]);
    return { success: true };
  };

  const updateEvent = (event: Event): { success: boolean; message?: string } => {
    if (hasEventConflict(event, events, event.id)) {
      return {
        success: false,
        message: 'This update conflicts with an existing event. Please choose a different time.',
      };
    }

    setEvents(prevEvents => prevEvents.map(e => (e.id === event.id ? event : e)));
    return { success: true };
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  };

  const moveEvent = (
    eventId: string,
    newDate: Date,
    moveEntireSeries: boolean
  ): { success: boolean; message?: string } => {
    const eventToMove = events.find(e => e.id === eventId);
    if (!eventToMove) return { success: false, message: 'Event not found' };

    const startDate = new Date(eventToMove.startDate);
    const endDate = new Date(eventToMove.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();

    const newStartDate = new Date(newDate);
    newStartDate.setHours(startDate.getHours());
    newStartDate.setMinutes(startDate.getMinutes());

    const newEndDate = new Date(newStartDate.getTime() + timeDiff);

    const updatedEvent: Event = {
      ...eventToMove,
      startDate: newStartDate.toISOString(),
      endDate: newEndDate.toISOString(),
    };

    if (moveEntireSeries && eventToMove.isRecurring) {
      updatedEvent.recurrence = {
        ...eventToMove.recurrence!,
        type: eventToMove.recurrence!.type,
      };
    } else if (eventToMove.isRecurring) {
      updatedEvent.isRecurring = false;
      updatedEvent.recurrence = null;
      updatedEvent.id = crypto.randomUUID();
    }

    if (hasEventConflict(updatedEvent, events, eventToMove.id)) {
      return {
        success: false,
        message: 'This move would conflict with an existing event.',
      };
    }

    if (eventToMove.isRecurring && !moveEntireSeries) {
      setEvents(prevEvents => [...prevEvents, updatedEvent]);
    } else {
      setEvents(prevEvents => prevEvents.map(e => (e.id === eventId ? updatedEvent : e)));
    }

    return { success: true };
  };

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearAllEvents = () => {
    if (window.confirm('Are you sure you want to delete all events? This action cannot be undone.')) {
      setEvents([]);
    }
  };

  const exportEvents = () => {
    return JSON.stringify(events, null, 2);
  };

  const importEvents = (jsonData: string): { success: boolean; message?: string } => {
    try {
      const newEvents = JSON.parse(jsonData);
      if (!Array.isArray(newEvents) || !newEvents.every(isValidEvent)) {
        return { success: false, message: 'Invalid event data format' };
      }
      setEvents(newEvents);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Error importing events: Invalid JSON data' };
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategories.length === 0 ||
      selectedCategories.includes(event.category);

    return matchesSearch && matchesCategory;
  });

  return (
    <CalendarContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        moveEvent,
        currentMonth,
        currentYear,
        setCurrentMonth,
        setCurrentYear,
        nextMonth,
        prevMonth,
        goToToday,
        searchTerm,
        setSearchTerm,
        selectedCategories,
        toggleCategory,
        filteredEvents,
        clearAllEvents,
        exportEvents,
        importEvents,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};