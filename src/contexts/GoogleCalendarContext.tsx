import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './ToastContext';

interface GoogleToken {
  accessToken: string;
  expiresAt: number;
}

interface GoogleCalendarContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  createCalendarEvent: (params: CalendarEventParams) => Promise<string | null>;
}

interface CalendarEventParams {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

export function GoogleCalendarProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [token, setToken] = useState<GoogleToken | null>(null);
  const tokenClientRef = useRef<any>(null);
  const gapiInited = useRef(false);
  const gisInited = useRef(false);

  const isConnected = !!token && token.expiresAt > Date.now();

  useEffect(() => {
    const loadScripts = async () => {
      // Load GAPI
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => gapiLoaded();
      document.head.appendChild(gapiScript);

      // Load GIS
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = () => gisLoaded();
      document.head.appendChild(gisScript);
    };

    loadScripts();
  }, []);

  const gapiLoaded = () => {
    const gapi = (window as any).gapi;
    if (!gapi) return;
    gapi.load('client', async () => {
      await gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited.current = true;
      maybeEnableConnect();
    });
  };

  const gisLoaded = () => {
    const google = (window as any).google;
    if (!google) return;
    tokenClientRef.current = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          setToken({
            accessToken: response.access_token,
            expiresAt: Date.now() + (response.expires_in || 3600) * 1000,
          });
          showToast('Connected to Google Calendar', 'success');
        }
      },
    });
    gisInited.current = true;
    maybeEnableConnect();
  };

  const maybeEnableConnect = () => {
    // Scripts loaded, button can be enabled
  };

  const connect = useCallback(() => {
    if (!tokenClientRef.current) {
      showToast('Google Calendar not loaded yet. Please try again.', 'warning');
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: '' });
  }, [showToast]);

  const disconnect = useCallback(() => {
    const google = (window as any).google;
    if (token?.accessToken && google) {
      google.accounts.oauth2.revoke(token.accessToken);
    }
    setToken(null);
    showToast('Disconnected from Google Calendar', 'info');
  }, [token, showToast]);

  const createCalendarEvent = useCallback(
    async (params: CalendarEventParams): Promise<string | null> => {
      if (!token || token.expiresAt < Date.now()) {
        showToast('Not connected to Google Calendar', 'error');
        return null;
      }

      try {
        const event = {
          summary: params.summary,
          description: params.description || '',
          start: {
            dateTime: params.startDateTime,
            timeZone: params.timeZone || 'Asia/Kolkata',
          },
          end: {
            dateTime: params.endDateTime,
            timeZone: params.timeZone || 'Asia/Kolkata',
          },
        };

        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );

        if (!response.ok) {
          throw new Error(`Calendar API error: ${response.status}`);
        }

        const data = await response.json();
        return data.id || null;
      } catch (error) {
        console.error('Failed to create calendar event:', error);
        showToast('Failed to sync to Google Calendar', 'error');
        return null;
      }
    },
    [token, showToast]
  );

  return (
    <GoogleCalendarContext.Provider
      value={{ isConnected, connect, disconnect, createCalendarEvent }}
    >
      {children}
    </GoogleCalendarContext.Provider>
  );
}

export function useGoogleCalendar() {
  const context = useContext(GoogleCalendarContext);
  if (!context) throw new Error('useGoogleCalendar must be used within GoogleCalendarProvider');
  return context;
}
