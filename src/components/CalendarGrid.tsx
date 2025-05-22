import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { getCalendarDays } from '../utils/dateUtils';
import CalendarDay from './CalendarDay';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid: React.FC = () => {
  const { currentMonth, currentYear, events, moveEvent } = useCalendar();
  const [currentWeekStart, setCurrentWeekStart] = useState(0);
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

  // Calculate visible days based on screen size
  const visibleDays = window.innerWidth < 768 ? 7 : calendarDays.length;
  const currentWeekDays = calendarDays.slice(currentWeekStart, currentWeekStart + visibleDays);

  const nextWeek = () => {
    if (currentWeekStart + 7 < calendarDays.length) {
      setCurrentWeekStart(currentWeekStart + 7);
    }
  };

  const prevWeek = () => {
    if (currentWeekStart - 7 >= 0) {
      setCurrentWeekStart(currentWeekStart - 7);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Mobile Week Navigation */}
        <div className="md:hidden flex items-center justify-between p-2 bg-gray-50 border-b">
          <button
            onClick={prevWeek}
            className="p-1 hover:bg-gray-200 rounded-full"
            disabled={currentWeekStart === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium">
            Week {Math.floor(currentWeekStart / 7) + 1}
          </span>
          <button
            onClick={nextWeek}
            className="p-1 hover:bg-gray-200 rounded-full"
            disabled={currentWeekStart + 7 >= calendarDays.length}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-500"
            >
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{day[0]}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {window.innerWidth < 768
            ? currentWeekDays.map((day, index) => (
                <CalendarDay
                  key={currentWeekStart + index}
                  day={day}
                  index={currentWeekStart + index}
                />
              ))
            : calendarDays.map((day, index) => (
                <CalendarDay key={index} day={day} index={index} />
              ))}
        </div>
      </div>
    </DragDropContext>
  );
};

export default CalendarGrid;