import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Event, EventCategory } from '../types';
import { hasEventConflict } from '../utils/dateUtils';

interface CalendarContextType {
  events: Event[];
  addEvent: (event: Event) => Promise<{ success: boolean; message?: string }>;
  updateEvent: (event: Event) => Promise<{ success: boolean; message?: string }>;
  deleteEvent: (eventId: string) => Promise<void>;
  moveEvent: (eventId: string, newDate: Date, moveEntireSeries: boolean) => Promise<{ success: boolean; message?: string }>;
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
  clearAllEvents: () => Promise<void>;
  exportEvents: () => string;
  importEvents: (jsonData: string) => Promise<{ success: boolean; message?: string }>;
  isLoading: boolean;
  lastSyncTime: Date | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

interface CalendarProviderProps {
  children: ReactNode;
}

// Storage configuration
const CONFIG = {
  INDEXEDDB_NAME: 'CalendarAppDB',
  INDEXEDDB_VERSION: 1,
  EVENTS_STORE: 'events',
  METADATA_STORE: 'metadata',
  LOCALSTORAGE_KEY: 'calendarEvents',
  LOCALSTORAGE_METADATA_KEY: 'calendarMetadata',
  SYNC_INTERVAL: 30000, // 30 seconds
};

// IndexedDB Database Manager
class CalendarDB {
  private db: IDBDatabase | null = null;
  private isInitialized: boolean = false;

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.INDEXEDDB_NAME, CONFIG.INDEXEDDB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create events store
        if (!db.objectStoreNames.contains(CONFIG.EVENTS_STORE)) {
          const eventsStore = db.createObjectStore(CONFIG.EVENTS_STORE, { keyPath: 'id' });
          eventsStore.createIndex('startDate', 'startDate', { unique: false });
          eventsStore.createIndex('category', 'category', { unique: false });
          eventsStore.createIndex('isRecurring', 'isRecurring', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(CONFIG.METADATA_STORE)) {
          db.createObjectStore(CONFIG.METADATA_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  async saveEvents(events: Event[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([CONFIG.EVENTS_STORE, CONFIG.METADATA_STORE], 'readwrite');
    const eventsStore = transaction.objectStore(CONFIG.EVENTS_STORE);
    const metadataStore = transaction.objectStore(CONFIG.METADATA_STORE);

    // Clear existing events
    await eventsStore.clear();

    // Add all events
    for (const event of events) {
      await eventsStore.add(event);
    }

    // Update metadata
    await metadataStore.put({
      key: 'lastSync',
      value: new Date().toISOString(),
      eventCount: events.length
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async loadEvents(): Promise<Event[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([CONFIG.EVENTS_STORE], 'readonly');
    const store = transaction.objectStore(CONFIG.EVENTS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const events = request.result || [];
        resolve(events);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getMetadata(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([CONFIG.METADATA_STORE], 'readonly');
    const store = transaction.objectStore(CONFIG.METADATA_STORE);
    const request = store.get('lastSync');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([CONFIG.EVENTS_STORE], 'readwrite');
    const store = transaction.objectStore(CONFIG.EVENTS_STORE);
    await store.delete(eventId);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async addEvent(event: Event): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([CONFIG.EVENTS_STORE], 'readwrite');
    const store = transaction.objectStore(CONFIG.EVENTS_STORE);
    await store.add(event);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async updateEvent(event: Event): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([CONFIG.EVENTS_STORE], 'readwrite');
    const store = transaction.objectStore(CONFIG.EVENTS_STORE);
    await store.put(event);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Storage Manager - handles both IndexedDB and localStorage
class StorageManager {
  private calendarDB: CalendarDB;
  private useIndexedDB: boolean = true;

  constructor() {
    this.calendarDB = new CalendarDB();
  }

  async init(): Promise<void> {
    try {
      await this.calendarDB.init();
      this.useIndexedDB = true;
      console.log('Using IndexedDB for storage');
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage:', error);
      this.useIndexedDB = false;
    }
  }

  async saveEvents(events: Event[]): Promise<void> {
    try {
      if (this.useIndexedDB) {
        await this.calendarDB.saveEvents(events);
      }
      
      // Always save to localStorage as backup
      const eventsData = JSON.stringify(events);
      const metadata = {
        lastSync: new Date().toISOString(),
        eventCount: events.length,
        version: CONFIG.INDEXEDDB_VERSION
      };
      
      localStorage.setItem(CONFIG.LOCALSTORAGE_KEY, eventsData);
      localStorage.setItem(CONFIG.LOCALSTORAGE_METADATA_KEY, JSON.stringify(metadata));
      
    } catch (error) {
      console.error('Error saving events:', error);
      // Fallback to localStorage only
      localStorage.setItem(CONFIG.LOCALSTORAGE_KEY, JSON.stringify(events));
      throw error;
    }
  }

  async loadEvents(): Promise<Event[]> {
    try {
      if (this.useIndexedDB) {
        const events = await this.calendarDB.loadEvents();
        if (events.length > 0) {
          return events;
        }
      }
      
      // Fallback to localStorage
      const savedEvents = localStorage.getItem(CONFIG.LOCALSTORAGE_KEY);
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        if (Array.isArray(parsedEvents)) {
          return parsedEvents.filter(this.isValidEvent);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error loading events:', error);
      return [];
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (this.useIndexedDB) {
      await this.calendarDB.deleteEvent(eventId);
    }
  }

  async addEvent(event: Event): Promise<void> {
    if (this.useIndexedDB) {
      await this.calendarDB.addEvent(event);
    }
  }

  async updateEvent(event: Event): Promise<void> {
    if (this.useIndexedDB) {
      await this.calendarDB.updateEvent(event);
    }
  }

  async getMetadata(): Promise<any> {
    try {
      if (this.useIndexedDB) {
        return await this.calendarDB.getMetadata();
      }
      
      const metadata = localStorage.getItem(CONFIG.LOCALSTORAGE_METADATA_KEY);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('Error getting metadata:', error);
      return null;
    }
  }

  private isValidEvent(event: any): event is Event {
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
  }
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const today = new Date();
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [storageManager] = useState(() => new StorageManager());

  // Initialize storage and load events
  useEffect(() => {
    const initializeStorage = async () => {
      setIsLoading(true);
      setSyncStatus('syncing');
      
      try {
        await storageManager.init();
        const loadedEvents = await storageManager.loadEvents();
        const metadata = await storageManager.getMetadata();
        
        setEvents(loadedEvents);
        if (metadata?.value) {
          setLastSyncTime(new Date(metadata.value));
        }
        
        setSyncStatus('success');
        console.log(`Loaded ${loadedEvents.length} events from storage`);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        setSyncStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, [storageManager]);

  // Auto-sync events periodically
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (events.length > 0) {
        try {
          setSyncStatus('syncing');
          await storageManager.saveEvents(events);
          setLastSyncTime(new Date());
          setSyncStatus('success');
        } catch (error) {
          console.error('Auto-sync failed:', error);
          setSyncStatus('error');
        }
      }
    }, CONFIG.SYNC_INTERVAL);

    return () => clearInterval(syncInterval);
  }, [events, storageManager]);

  // Save events whenever they change
  const saveEventsToStorage = useCallback(async (eventsToSave: Event[]) => {
    try {
      setSyncStatus('syncing');
      await storageManager.saveEvents(eventsToSave);
      setLastSyncTime(new Date());
      setSyncStatus('success');
    } catch (error) {
      console.error('Error saving events:', error);
      setSyncStatus('error');
      throw error;
    }
  }, [storageManager]);

  // Navigation functions
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

  // Event management functions
  const addEvent = async (event: Event): Promise<{ success: boolean; message?: string }> => {
    if (hasEventConflict(event, events)) {
      return {
        success: false,
        message: 'This event conflicts with an existing event. Please choose a different time.',
      };
    }

    try {
      const newEvents = [...events, event];
      await storageManager.addEvent(event);
      setEvents(newEvents);
      await saveEventsToStorage(newEvents);
      return { success: true };
    } catch (error) {
      console.error('Error adding event:', error);
      return { success: false, message: 'Failed to save event. Please try again.' };
    }
  };

  const updateEvent = async (event: Event): Promise<{ success: boolean; message?: string }> => {
    if (hasEventConflict(event, events, event.id)) {
      return {
        success: false,
        message: 'This update conflicts with an existing event. Please choose a different time.',
      };
    }

    try {
      const newEvents = events.map(e => (e.id === event.id ? event : e));
      await storageManager.updateEvent(event);
      setEvents(newEvents);
      await saveEventsToStorage(newEvents);
      return { success: true };
    } catch (error) {
      console.error('Error updating event:', error);
      return { success: false, message: 'Failed to update event. Please try again.' };
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      const newEvents = events.filter(event => event.id !== eventId);
      await storageManager.deleteEvent(eventId);
      setEvents(newEvents);
      await saveEventsToStorage(newEvents);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event. Please try again.');
    }
  };

  const moveEvent = async (
    eventId: string,
    newDate: Date,
    moveEntireSeries: boolean
  ): Promise<{ success: boolean; message?: string }> => {
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

    try {
      let newEvents: Event[];
      if (eventToMove.isRecurring && !moveEntireSeries) {
        newEvents = [...events, updatedEvent];
        await storageManager.addEvent(updatedEvent);
      } else {
        newEvents = events.map(e => (e.id === eventId ? updatedEvent : e));
        await storageManager.updateEvent(updatedEvent);
      }

      setEvents(newEvents);
      await saveEventsToStorage(newEvents);
      return { success: true };
    } catch (error) {
      console.error('Error moving event:', error);
      return { success: false, message: 'Failed to move event. Please try again.' };
    }
  };

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearAllEvents = async (): Promise<void> => {
    if (window.confirm('Are you sure you want to delete all events? This action cannot be undone.')) {
      try {
        setEvents([]);
        await saveEventsToStorage([]);
      } catch (error) {
        console.error('Error clearing events:', error);
        throw new Error('Failed to clear events. Please try again.');
      }
    }
  };

  const exportEvents = (): string => {
    const exportData = {
      events,
      exportDate: new Date().toISOString(),
      version: CONFIG.INDEXEDDB_VERSION,
      metadata: {
        totalEvents: events.length,
        categories: [...new Set(events.map(e => e.category))],
      }
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importEvents = async (jsonData: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const importData = JSON.parse(jsonData);
      let eventsToImport: Event[];

      // Handle different import formats
      if (importData.events && Array.isArray(importData.events)) {
        eventsToImport = importData.events;
      } else if (Array.isArray(importData)) {
        eventsToImport = importData;
      } else {
        return { success: false, message: 'Invalid import format' };
      }

      // Validate events
      const validEvents = eventsToImport.filter(event => {
        return (
          typeof event === 'object' &&
          typeof event.id === 'string' &&
          typeof event.title === 'string' &&
          typeof event.startDate === 'string' &&
          typeof event.endDate === 'string'
        );
      });

      if (validEvents.length === 0) {
        return { success: false, message: 'No valid events found in import data' };
      }

      setEvents(validEvents);
      await saveEventsToStorage(validEvents);
      
      return { 
        success: true, 
        message: `Successfully imported ${validEvents.length} events` 
      };
    } catch (error) {
      console.error('Error importing events:', error);
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
        isLoading,
        lastSyncTime,
        syncStatus,
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