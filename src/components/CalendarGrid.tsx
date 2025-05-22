import React from 'react';
import { useCalendar } from '../context/CalendarContext';
import { getCalendarDays } from '../utils/dateUtils';
import CalendarDay from './CalendarDay';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid: React.FC = () => {
  const { currentMonth, currentYear, events } = useCalendar();
  const calendarDays = getCalendarDays(currentYear, currentMonth, events);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Days of week header */}
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

      {/* Calendar days grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, index) => (
          <CalendarDay key={index} day={day} />
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;