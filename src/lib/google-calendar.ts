// ─── Google Calendar API Integration ───
// Stubs for Google Calendar sync in the Planning module.
// Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY in .env.local
// See docs/google-calendar-setup.md for full setup instructions.

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

/** Check if Google Calendar is configured */
export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    CLIENT_ID &&
    API_KEY &&
    CLIENT_ID !== 'your-google-client-id.apps.googleusercontent.com' &&
    API_KEY !== 'your-google-api-key'
  );
}

/** Initialize the Google API client */
export async function initGoogleCalendar(): Promise<boolean> {
  if (!isGoogleCalendarConfigured()) {
    console.warn('[Google Calendar] Not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY in .env.local');
    return false;
  }

  try {
    // Load the Google API script
    await loadScript('https://apis.google.com/js/api.js');
    await loadScript('https://accounts.google.com/gsi/client');

    await new Promise<void>((resolve, reject) => {
      window.gapi.load('client', {
        callback: resolve,
        onerror: reject,
      });
    });

    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });

    return true;
  } catch (error) {
    console.error('[Google Calendar] Init failed:', error);
    return false;
  }
}

/** Sign in with Google OAuth */
export async function signInGoogle(): Promise<string | null> {
  if (!CLIENT_ID) return null;

  return new Promise((resolve) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.error) {
          console.error('[Google Calendar] Auth error:', response.error);
          resolve(null);
        } else if (response.access_token) {
          // Persist token in localStorage with 1 hour expiry
          localStorage.setItem('gcal_access_token', response.access_token);
          localStorage.setItem('gcal_token_expiry', String(Date.now() + 3600 * 1000));
          resolve(response.access_token);
        } else {
          resolve(null);
        }
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  });
}

/** Sign out of Google */
export function signOutGoogle(): void {
  const token = window.gapi?.client?.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken(null);
  }
  localStorage.removeItem('gcal_access_token');
  localStorage.removeItem('gcal_token_expiry');
}

/** Restore Google OAuth token from localStorage if valid */
export function restoreGoogleToken(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('gcal_access_token');
  const expiryStr = localStorage.getItem('gcal_token_expiry');
  if (!token || !expiryStr) return false;

  const expiry = Number(expiryStr);
  if (Date.now() > expiry) {
    localStorage.removeItem('gcal_access_token');
    localStorage.removeItem('gcal_token_expiry');
    return false;
  }

  if (window.gapi?.client) {
    window.gapi.client.setToken({ access_token: token } as any);
    return true;
  }
  return false;
}

/** Fetch calendar events for a date range */
export async function fetchCalendarEvents(
  startDate: string,
  endDate: string
): Promise<GoogleCalendarEvent[]> {
  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: `${startDate}T00:00:00Z`,
      timeMax: `${endDate}T23:59:59Z`,
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });

    return response.result.items || [];
  } catch (error) {
    console.error('[Google Calendar] Fetch events error:', error);
    return [];
  }
}

/** Create an event from a planning item */
export async function createCalendarEvent(plan: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): Promise<string | null> {
  try {
    const event = {
      summary: plan.title,
      description: plan.notes || '',
      start: {
        dateTime: `${plan.date}T${plan.startTime}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: `${plan.date}T${plan.endTime}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    const response = await window.gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.result.id || null;
  } catch (error) {
    console.error('[Google Calendar] Create event error:', error);
    return null;
  }
}

/** Delete a calendar event */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    await window.gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return true;
  } catch (error) {
    console.error('[Google Calendar] Delete event error:', error);
    return false;
  }
}

// ─── Helpers ───

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

// ─── Type Declarations for Google APIs ───

declare global {
  interface Window {
    gapi: {
      load: (api: string, options: { callback: () => void; onerror: () => void }) => void;
      client: {
        init: (config: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
        getToken: () => { access_token: string } | null;
        setToken: (token: null) => void;
        calendar: {
          events: {
            list: (params: Record<string, unknown>) => Promise<{ result: { items: GoogleCalendarEvent[] } }>;
            insert: (params: { calendarId: string; resource: Record<string, unknown> }) => Promise<{ result: { id: string } }>;
            delete: (params: { calendarId: string; eventId: string }) => Promise<void>;
          };
        };
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (options: { prompt: string }) => void };
          revoke: (token: string) => void;
        };
      };
    };
  }
}
