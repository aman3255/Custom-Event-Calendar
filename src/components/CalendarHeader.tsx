import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
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
    setCurrentMonth,
    setCurrentYear,
  } = useCalendar();

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const handleMonthClick = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setShowMonthDropdown(false);
  };

  const handleYearClick = (year: number) => {
    setCurrentYear(year);
    setShowYearDropdown(false);
  };

  return (
    <header className="bg-white shadow-sm p-4 mb-4 rounded-lg">
      <div className="flex flex-col space-y-4">
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
            
            <div className="relative">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setShowMonthDropdown(!showMonthDropdown);
                    setShowYearDropdown(false);
                  }}
                  className="text-xl font-semibold text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  {months[currentMonth]}
                </button>
                <button
                  onClick={() => {
                    setShowYearDropdown(!showYearDropdown);
                    setShowMonthDropdown(false);
                  }}
                  className="text-xl font-semibold text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  {currentYear}
                </button>
              </div>

              {showMonthDropdown && (
                <div className="absolute z-10 mt-1 w-40 bg-white rounded-md shadow-lg py-1 max-h-60 overflow-auto">
                  {months.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => handleMonthClick(index)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        currentMonth === index ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}

              {showYearDropdown && (
                <div className="absolute z-10 mt-1 w-24 bg-white rounded-md shadow-lg py-1 max-h-60 overflow-auto">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearClick(year)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        currentYear === year ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default CalendarHeader;