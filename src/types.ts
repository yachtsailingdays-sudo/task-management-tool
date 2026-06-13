/** A task the user wants to do, sitting in the sidebar backlog. */
export interface Task {
  id: string;
  title: string;
  /** Planned duration in minutes. Defaults to 30. */
  durationMinutes: number;
  notes?: string;
  createdAt: string;
  /** Set once the task has been scheduled onto the calendar. */
  scheduledEventId?: string;
}

/** A calendar event. Mirrors the relevant subset of a Microsoft Graph event. */
export interface CalendarEvent {
  id: string;
  subject: string;
  /** ISO 8601 string in local time. */
  start: string;
  /** ISO 8601 string in local time. */
  end: string;
  /** Links back to the originating task, when this event was created from one. */
  taskId?: string;
  /** True when the event was created by this app (vs. fetched from Outlook). */
  createdHere?: boolean;
}

export type CalendarMode = 'mock' | 'graph';

/** Common interface implemented by both the mock and the real Graph backend. */
export interface CalendarBackend {
  readonly mode: CalendarMode;
  /** Resolve once the backend is ready to take calls. */
  init(): Promise<void>;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  /** Display name / email of the signed-in account, or null. */
  getAccount(): string | null;
  /** List events overlapping the [start, end) window. */
  listEvents(startISO: string, endISO: string): Promise<CalendarEvent[]>;
  createEvent(input: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;
}
