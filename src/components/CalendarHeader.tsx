import React from 'react';
import { useCalendar } from '../context/CalendarContext';
import { getFormattedMonthYear } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Search, Calendar } from 'lucide-react';

const CalendarHeader: React.FC = () => {
  const {
    currentMonth,
    currentYear,
    nextMonth,
    prevMonth,
    goToToday,
    searchTerm,
    setSearchTerm,
  } = useCalendar();

  return (
    <header className="bg-white shadow-sm p-4 mb-4 rounded-lg">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Calendar className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Event Calendar</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
          >
            Today
          </button>
          
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-700 w-40 text-center">
            {getFormattedMonthYear(currentYear, currentMonth)}
          </h2>
          
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <div className="relative mt-4 md:mt-0 w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events..."
            className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </header>
  );
};

export default CalendarHeader;