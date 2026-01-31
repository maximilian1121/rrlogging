import { createContext, useContext, ReactNode } from 'react';
import { useEvents } from '@/hooks/useEvents';

interface EventsContextType {
  events: any[];
  isConnected: boolean;
  error: Event | null;
  clearEvents: () => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const eventsData = useEvents();
  
  return (
    <EventsContext.Provider value={eventsData}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEventsContext() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEventsContext must be used within an EventsProvider');
  }
  return context;
}