import React, { useState } from 'react';
import { CalendarDay as CalendarDayType } from '../types';
import EventItem from './EventItem';
import EventModal from './EventModal';
import { generateDateTimeString } from '../utils/dateUtils';
import { Droppable } from '@hello-pangea/dnd';

interface CalendarDayProps {
  day: CalendarDayType;
  index: number;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, index }) => {
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

  const dayClasses = `
    min-h-[100px] md:min-h-24 p-1 border border-gray-200 relative
    ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
    ${day.isToday ? 'bg-blue-50' : ''}
    hover:bg-gray-50 transition-colors duration-150
  `;

  const dateNumber = day.date.getDate();
  
  const initialStartTime = generateDateTimeString(
    day.date.getFullYear(),
    day.date.getMonth(),
    day.date.getDate(),
    9,
    0
  );
  
  const initialEndTime = generateDateTimeString(
    day.date.getFullYear(),
    day.date.getMonth(),
    day.date.getDate(),
    10,
    0
  );

  return (
    <Droppable droppableId={`day-${index}`}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`${dayClasses} ${
            snapshot.isDraggingOver ? 'bg-blue-50' : ''
          }`}
          onClick={handleDayClick}
        >
          <div 
            className={`
              text-right mb-1 
              ${day.isToday 
                ? 'bg-blue-600 text-white w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center ml-auto font-bold shadow-md text-sm md:text-base' 
                : 'text-sm'
              }
            `}
          >
            {dateNumber}
          </div>

          <div className="space-y-1 overflow-y-auto max-h-16 md:max-h-20">
            {day.events.map((event, eventIndex) => (
              <EventItem
                key={event.id}
                event={event}
                index={eventIndex}
                onClick={(e) => handleEventClick(event.id, e)}
              />
            ))}
            {provided.placeholder}
            
            {day.events.length > 2 && (
              <div className="text-xs text-gray-500 pl-1">
                +{day.events.length - 2} more
              </div>
            )}
          </div>

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
      )}
    </Droppable>
  );
};

export default CalendarDay;