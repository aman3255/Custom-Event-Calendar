import React, { useState, useEffect } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { Event, RecurrencePattern, RecurrenceType } from '../types';
import { X, Trash, Calendar, Clock, AlignLeft, Repeat, Circle } from 'lucide-react';

interface EventModalProps {
  date: Date;
  eventId: string | null;
  onClose: () => void;
  initialValues?: {
    startDate: string;
    endDate: string;
  };
}

const EVENT_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#06B6D4', // Cyan
];

const EventModal: React.FC<EventModalProps> = ({
  date,
  eventId,
  onClose,
  initialValues,
}) => {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendar();
  
  // Find the event if editing an existing one
  const existingEvent = eventId 
    ? events.find(event => event.id === eventId) 
    : null;
  
  // Form state
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [startDate, setStartDate] = useState(
    existingEvent?.startDate || initialValues?.startDate || new Date().toISOString()
  );
  const [endDate, setEndDate] = useState(
    existingEvent?.endDate || initialValues?.endDate || new Date().toISOString()
  );
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [color, setColor] = useState(existingEvent?.color || EVENT_COLORS[0]);
  const [isRecurring, setIsRecurring] = useState(existingEvent?.isRecurring || false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    existingEvent?.recurrence?.type || 'daily'
  );
  const [interval, setInterval] = useState(existingEvent?.recurrence?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    existingEvent?.recurrence?.daysOfWeek || [date.getDay()]
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    existingEvent?.recurrence?.dayOfMonth || date.getDate()
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    existingEvent?.recurrence?.endDate || ''
  );
  const [errorMessage, setErrorMessage] = useState('');

  // Format date for input fields
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format: "YYYY-MM-DDThh:mm"
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate form
    if (!title.trim()) {
      setErrorMessage('Please enter an event title');
      return;
    }

    // Create recurrence pattern if recurring
    let recurrencePattern: RecurrencePattern | null = null;
    if (isRecurring) {
      recurrencePattern = {
        type: recurrenceType,
        interval: recurrenceType === 'daily' ? 1 : interval,
        daysOfWeek: recurrenceType === 'weekly' ? daysOfWeek : undefined,
        dayOfMonth: recurrenceType === 'monthly' ? dayOfMonth : undefined,
        endDate: recurrenceType === 'daily' || recurrenceType === 'weekly' ? undefined : recurrenceEndDate || undefined,
      };
    }

    // Create event object
    const eventData: Event = {
      id: existingEvent?.id || crypto.randomUUID(),
      title,
      startDate,
      endDate,
      description,
      color,
      isRecurring,
      recurrence: recurrencePattern,
    };

    // Add or update the event
    let result;
    if (existingEvent) {
      result = updateEvent(eventData);
    } else {
      result = addEvent(eventData);
    }

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.message || 'Error saving event');
    }
  };

  // Handle event deletion
  const handleDelete = () => {
    if (existingEvent && confirm('Are you sure you want to delete this event?')) {
      deleteEvent(existingEvent.id);
      onClose();
    }
  };

  // Handle day of week toggle for weekly recurrence
  const toggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {existingEvent ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Error message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {errorMessage}
            </div>
          )}

          {/* Event title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add title"
              autoFocus
            />
          </div>

          {/* Event date and time */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formatDateForInput(startDate)}
                onChange={(e) => setStartDate(new Date(e.target.value).toISOString())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formatDateForInput(endDate)}
                onChange={(e) => setEndDate(new Date(e.target.value).toISOString())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Event description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <AlignLeft className="h-4 w-4 mr-1" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add description"
            ></textarea>
          </div>

          {/* Event color */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Circle className="h-4 w-4 mr-1" />
              Event Color
            </label>
            <div className="flex space-x-2">
              {EVENT_COLORS.map((eventColor) => (
                <button
                  key={eventColor}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === eventColor
                      ? 'border-gray-800'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: eventColor }}
                  onClick={() => setColor(eventColor)}
                  aria-label={`Select ${eventColor} color`}
                />
              ))}
            </div>
          </div>

          {/* Recurrence options */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="recurring"
                className="ml-2 text-sm font-medium text-gray-700 flex items-center"
              >
                <Repeat className="h-4 w-4 mr-1" />
                Recurring Event
              </label>
            </div>

            {isRecurring && (
              <div className="pl-6 border-l-2 border-gray-200">
                {/* Recurrence type */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repeat
                  </label>
                  <select
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Interval - Hidden for daily and weekly recurrence */}
                {recurrenceType !== 'daily' && recurrenceType !== 'weekly' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Every
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={interval}
                        onChange={(e) => setInterval(parseInt(e.target.value))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        {recurrenceType === 'monthly'
                          ? 'months'
                          : 'days'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Days of week for weekly recurrence */}
                {recurrenceType === 'weekly' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      On these days
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`w-8 h-8 rounded-full text-sm font-medium ${
                            daysOfWeek.includes(index)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                          onClick={() => toggleDayOfWeek(index)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Day of month for monthly recurrence */}
                {recurrenceType === 'monthly' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      On day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* End date - Hidden for daily and weekly recurrence */}
                {recurrenceType !== 'daily' && recurrenceType !== 'weekly' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ends
                    </label>
                    <input
                      type="date"
                      value={recurrenceEndDate ? recurrenceEndDate.split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value).toISOString()
                          : '';
                        setRecurrenceEndDate(date);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="flex justify-between pt-4 border-t">
            {existingEvent ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center"
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </button>
            ) : (
              <div></div>
            )}
            <div className="space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {existingEvent ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;