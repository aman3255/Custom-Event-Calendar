import React from 'react';
import { useCalendar } from '../context/CalendarContext';
import { getCalendarDays } from '../utils/dateUtils';
import CalendarDay from './CalendarDay';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid: React.FC = () => {
  const { currentMonth, currentYear, events, moveEvent } = useCalendar();
  const calendarDays = getCalendarDays(currentYear, currentMonth, events);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceDay = parseInt(result.source.droppableId.split('-')[1]);
    const destinationDay = parseInt(result.destination.droppableId.split('-')[1]);
    const eventIndex = result.source.index;

    const event = calendarDays[sourceDay].events[eventIndex];
    if (event.isRecurring) {
      const moveEntireSeries = window.confirm(
        'This is a recurring event. Would you like to move the entire series?\nClick OK to move the entire series, or Cancel to move only this instance.'
      );
      moveEvent(event.id, calendarDays[destinationDay].date, moveEntireSeries);
    } else {
      moveEvent(event.id, calendarDays[destinationDay].date, false);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day, index) => (
            <CalendarDay key={index} day={day} index={index} />
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};

export default CalendarGrid;