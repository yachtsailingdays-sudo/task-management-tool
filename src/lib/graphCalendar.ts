import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  type AccountInfo,
} from '@azure/msal-browser';
import type { CalendarBackend, CalendarEvent } from '../types';
import { GRAPH_BASE, GRAPH_SCOPES, msalConfig } from './msalConfig';
import { localTimeZone } from './dates';

/** Shape of a Microsoft Graph calendar event (subset we use). */
interface GraphEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

/**
 * Real Outlook integration via Microsoft Graph + MSAL.
 * Only instantiated when VITE_MS_CLIENT_ID is configured.
 */
export class GraphCalendar implements CalendarBackend {
  readonly mode = 'graph' as const;
  private msal: PublicClientApplication;
  private account: AccountInfo | null = null;

  constructor() {
    this.msal = new PublicClientApplication(msalConfig);
  }

  async init(): Promise<void> {
    await this.msal.initialize();
    // Complete any pending redirect sign-in.
    const result = await this.msal.handleRedirectPromise();
    if (result?.account) {
      this.account = result.account;
      this.msal.setActiveAccount(result.account);
    } else {
      const accounts = this.msal.getAllAccounts();
      if (accounts.length > 0) {
        this.account = accounts[0];
        this.msal.setActiveAccount(accounts[0]);
      }
    }
  }

  async signIn(): Promise<void> {
    const result = await this.msal.loginPopup({ scopes: GRAPH_SCOPES });
    this.account = result.account;
    this.msal.setActiveAccount(result.account);
  }

  async signOut(): Promise<void> {
    if (this.account) {
      await this.msal.logoutPopup({ account: this.account });
    }
    this.account = null;
  }

  getAccount(): string | null {
    return this.account?.username ?? null;
  }

  private async token(): Promise<string> {
    if (!this.account) throw new Error('サインインしていません。');
    try {
      const res = await this.msal.acquireTokenSilent({
        scopes: GRAPH_SCOPES,
        account: this.account,
      });
      return res.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        const res = await this.msal.acquireTokenPopup({ scopes: GRAPH_SCOPES });
        return res.accessToken;
      }
      throw err;
    }
  }

  private async graphFetch(path: string, init?: RequestInit): Promise<Response> {
    const token = await this.token();
    const res = await fetch(`${GRAPH_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Graph API エラー (${res.status}): ${text}`);
    }
    return res;
  }

  async listEvents(startISO: string, endISO: string): Promise<CalendarEvent[]> {
    const tz = localTimeZone();
    const params = new URLSearchParams({
      startDateTime: startISO,
      endDateTime: endISO,
      $orderby: 'start/dateTime',
      $top: '200',
    });
    const res = await this.graphFetch(`/me/calendarView?${params.toString()}`, {
      headers: { Prefer: `outlook.timezone="${tz}"` },
    });
    const data = (await res.json()) as { value: GraphEvent[] };
    return data.value.map((g) => ({
      id: g.id,
      subject: g.subject,
      start: g.start.dateTime,
      end: g.end.dateTime,
    }));
  }

  async createEvent(input: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const tz = localTimeZone();
    const body = {
      subject: input.subject,
      start: { dateTime: input.start, timeZone: tz },
      end: { dateTime: input.end, timeZone: tz },
    };
    const res = await this.graphFetch('/me/events', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const g = (await res.json()) as GraphEvent;
    return {
      id: g.id,
      subject: g.subject,
      start: g.start.dateTime,
      end: g.end.dateTime,
      taskId: input.taskId,
      createdHere: true,
    };
  }

  async deleteEvent(id: string): Promise<void> {
    await this.graphFetch(`/me/events/${id}`, { method: 'DELETE' });
  }
}
