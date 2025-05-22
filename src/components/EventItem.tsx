import React from 'react';
import { Event } from '../types';
import { Repeat } from 'lucide-react';

interface EventItemProps {
  event: Event;
  onClick: (e: React.MouseEvent) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, onClick }) => {
  // Format the event time (e.g., "9:00 AM")
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div
      className="px-2 py-1 text-xs rounded-md cursor-pointer truncate flex items-center group"
      style={{ backgroundColor: `${event.color}20`, borderLeft: `3px solid ${event.color}` }}
      onClick={onClick}
    >
      <div className="truncate flex-1">
        <span className="font-medium">{formatEventTime(event.startDate)}</span>
        {' '}
        {event.title}
      </div>
      
      {event.isRecurring && (
        <Repeat className="h-3 w-3 ml-1 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
};

export default EventItem;