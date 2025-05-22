import React from 'react';
import { Event } from '../types';
import { Repeat } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

interface EventItemProps {
  event: Event;
  index: number;
  onClick: (e: React.MouseEvent) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, index, onClick }) => {
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Draggable draggableId={event.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`px-1.5 md:px-2 py-0.5 md:py-1 text-xs rounded-md cursor-pointer truncate flex items-center group ${
            snapshot.isDragging ? 'shadow-lg' : ''
          }`}
          style={{
            backgroundColor: `${event.color}20`,
            borderLeft: `3px solid ${event.color}`,
            ...provided.draggableProps.style,
          }}
          onClick={onClick}
        >
          <div className="truncate flex-1">
            <span className="font-medium hidden md:inline">{formatEventTime(event.startDate)}</span>
            <span className="md:hidden">{formatEventTime(event.startDate)}</span>
            {' '}
            {event.title}
          </div>
          
          {event.isRecurring && (
            <Repeat className="h-3 w-3 ml-1 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
          )}
        </div>
      )}
    </Draggable>
  );
};

export default EventItem;