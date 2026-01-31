import { useEffect, useState, useRef } from 'react';

interface UseEventsReturn {
  events: any[];
  isConnected: boolean;
  error: Event | null;
  clearEvents: () => void;
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  useEffect(() => {
    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event: MessageEvent) => {
        if (event.data.startsWith(':')) {
          return;
        }

        try {
          const data = JSON.parse(event.data);
          setEvents((prev) => [...prev, data]);
        } catch (err) {
          setEvents((prev) => [...prev, event.data]);
        }
      };

      eventSource.onerror = (err: Event) => {
        setIsConnected(false);
        setError(err);
        eventSource.close();

        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    events,
    isConnected,
    error,
    clearEvents: () => setEvents([])
  };
}