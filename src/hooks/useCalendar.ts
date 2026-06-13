import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CalendarBackend, CalendarEvent } from '../types';
import { isGraphConfigured } from '../lib/msalConfig';
import { MockCalendar } from '../lib/mockCalendar';
import { GraphCalendar } from '../lib/graphCalendar';
import { addDays, toLocalISO } from '../lib/dates';

function createBackend(): CalendarBackend {
  return isGraphConfigured ? new GraphCalendar() : new MockCalendar();
}

/**
 * Owns the active calendar backend (mock or Graph), the signed-in account,
 * and the events for the currently displayed week.
 */
export function useCalendar(weekStart: Date) {
  const backendRef = useRef<CalendarBackend>();
  if (!backendRef.current) backendRef.current = createBackend();
  const backend = backendRef.current;

  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    backend
      .init()
      .then(() => {
        if (cancelled) return;
        setAccount(backend.getAccount());
        setReady(true);
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [backend]);

  const refresh = useCallback(async () => {
    if (!account) {
      setEvents([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const startISO = toLocalISO(weekStart);
      const endISO = toLocalISO(addDays(weekStart, 7));
      const list = await backend.listEvents(startISO, endISO);
      setEvents(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [account, backend, weekStart]);

  useEffect(() => {
    if (ready) void refresh();
  }, [ready, refresh]);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      await backend.signIn();
      setAccount(backend.getAccount());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [backend]);

  const signOut = useCallback(async () => {
    await backend.signOut();
    setAccount(null);
    setEvents([]);
  }, [backend]);

  const createEvent = useCallback(
    async (input: Omit<CalendarEvent, 'id'>) => {
      const created = await backend.createEvent(input);
      setEvents((prev) => [...prev, created]);
      return created;
    },
    [backend],
  );

  const moveEvent = useCallback(
    async (id: string, startISO: string, endISO: string) => {
      const updated = await backend.updateEvent(id, { start: startISO, end: endISO });
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
      return updated;
    },
    [backend],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      await backend.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    },
    [backend],
  );

  return useMemo(
    () => ({
      mode: backend.mode,
      ready,
      account,
      events,
      loading,
      error,
      signIn,
      signOut,
      createEvent,
      moveEvent,
      deleteEvent,
      refresh,
    }),
    [
      backend.mode,
      ready,
      account,
      events,
      loading,
      error,
      signIn,
      signOut,
      createEvent,
      moveEvent,
      deleteEvent,
      refresh,
    ],
  );
}
