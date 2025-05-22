import React, { useState } from 'react';
import { CalendarDay as CalendarDayType } from '../types';
import EventItem from './EventItem';
import EventModal from './EventModal';
import { generateDateTimeString } from '../utils/dateUtils';

interface CalendarDayProps {
  day: CalendarDayType;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day }) => {
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const handleDayClick = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(eventId);
    setShowEventModal(true);
  };

  // Build class names based on day properties
  const dayClasses = `
    min-h-24 p-1 border border-gray-200 relative
    ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
    ${day.isToday ? 'bg-blue-50' : ''}
    hover:bg-gray-50 transition-colors duration-150
  `;

  // Get the date number for display
  const dateNumber = day.date.getDate();
  
  // Calculate initial event time for this day
  const initialStartTime = generateDateTimeString(
    day.date.getFullYear(),
    day.date.getMonth(),
    day.date.getDate(),
    9, // Default to 9 AM
    0  // Default to 0 minutes
  );
  
  const initialEndTime = generateDateTimeString(
    day.date.getFullYear(),
    day.date.getMonth(),
    day.date.getDate(),
    10, // Default to 10 AM (1 hour later)
    0   // Default to 0 minutes
  );

  return (
    <div className={dayClasses} onClick={handleDayClick}>
      {/* Date number */}
      <div 
        className={`
          text-right mb-1 
          ${day.isToday 
            ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center ml-auto font-bold shadow-md' 
            : 'text-sm'
          }
        `}
      >
        {dateNumber}
      </div>

      {/* Event items */}
      <div className="space-y-1 overflow-y-auto max-h-20">
        {day.events.slice(0, 3).map((event) => (
          <EventItem
            key={event.id}
            event={event}
            onClick={(e) => handleEventClick(event.id, e)}
          />
        ))}
        
        {/* Show "+X more" if there are more than 3 events */}
        {day.events.length > 3 && (
          <div className="text-xs text-gray-500 pl-1">
            +{day.events.length - 3} more
          </div>
        )}
      </div>

      {/* Event modal */}
      {showEventModal && (
        <EventModal
          date={day.date}
          eventId={selectedEvent}
          onClose={() => setShowEventModal(false)}
          initialValues={{
            startDate: initialStartTime,
            endDate: initialEndTime,
          }}
        />
      )}
    </div>
  );
};

export default CalendarDay;