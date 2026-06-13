import type { CalendarBackend, CalendarEvent } from '../types';

const STORAGE_KEY = 'tmt.mock.events';
const ACCOUNT_KEY = 'tmt.mock.account';

function loadAll(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CalendarEvent[]) : [];
  } catch {
    return [];
  }
}

function saveAll(events: CalendarEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function uid(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * A drop-in replacement for the real Outlook/Graph backend that persists
 * events to localStorage. It mirrors the same async surface so the UI code
 * is identical regardless of which backend is active.
 */
export class MockCalendar implements CalendarBackend {
  readonly mode = 'mock' as const;
  private account: string | null = null;

  async init(): Promise<void> {
    this.account = localStorage.getItem(ACCOUNT_KEY);
    // Seed a couple of "existing" meetings the first time, so the calendar
    // looks like a real Outlook calendar with prior commitments.
    if (!localStorage.getItem(STORAGE_KEY)) {
      saveAll(seedEvents());
    }
  }

  async signIn(): Promise<void> {
    this.account = 'demo.user@outlook.local (デモ)';
    localStorage.setItem(ACCOUNT_KEY, this.account);
  }

  async signOut(): Promise<void> {
    this.account = null;
    localStorage.removeItem(ACCOUNT_KEY);
  }

  getAccount(): string | null {
    return this.account;
  }

  async listEvents(startISO: string, endISO: string): Promise<CalendarEvent[]> {
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();
    return loadAll().filter((e) => {
      const s = new Date(e.start).getTime();
      return s >= start && s < end;
    });
  }

  async createEvent(input: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const event: CalendarEvent = { ...input, id: uid(), createdHere: true };
    const all = loadAll();
    all.push(event);
    saveAll(all);
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    saveAll(loadAll().filter((e) => e.id !== id));
  }
}

/** Produce a few sample meetings for the current week so the grid isn't empty. */
function seedEvents(): CalendarEvent[] {
  const now = new Date();
  const monday = new Date(now);
  const day = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - day);
  monday.setHours(0, 0, 0, 0);

  const at = (dayOffset: number, hour: number, min: number) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, min, 0, 0);
    return d;
  };
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes(),
    ).padStart(2, '0')}:00`;

  return [
    {
      id: 'seed_standup',
      subject: '朝会 (デイリースタンドアップ)',
      start: iso(at(0, 9, 30)),
      end: iso(at(0, 10, 0)),
    },
    {
      id: 'seed_review',
      subject: '週次レビュー',
      start: iso(at(2, 14, 0)),
      end: iso(at(2, 15, 0)),
    },
    {
      id: 'seed_1on1',
      subject: '1on1',
      start: iso(at(3, 11, 0)),
      end: iso(at(3, 11, 30)),
    },
  ];
}
