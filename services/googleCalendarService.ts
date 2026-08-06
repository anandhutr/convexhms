import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { Client, ClientEvent } from '../types';

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Google OAuth access token');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Calendar login error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCalendarAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface SyncResult {
  success: boolean;
  eventId?: string;
  htmlLink?: string;
  error?: string;
}

/**
 * Creates or updates an event on the user's primary Google Calendar
 */
export const createGoogleCalendarEvent = async (
  client: Client,
  event: ClientEvent
): Promise<SyncResult> => {
  const token = getCalendarAccessToken();
  if (!token) {
    return { success: false, error: 'Google Calendar not connected. Please Sign In with Google first.' };
  }

  try {
    const startIso = event.date ? `${event.date}` : new Date().toISOString().split('T')[0];
    
    // Calculate end date (default 1 day event)
    const startDateObj = new Date(startIso);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endIso = endDateObj.toISOString().split('T')[0];

    const eventPayload = {
      summary: `📸 ${client.name} - ${event.type} (${event.sideType || client.workScope || 'Both'} Side)`,
      location: event.venue || 'Venue TBD',
      description: `Studio Booking Details:\nClient Name: ${client.name}\nPhone: ${client.phone}\nEmail: ${client.email || 'N/A'}\nReligion / Tradition: ${client.religion}\nWork Scope: ${client.workScope || 'Both'}\nEvent Type: ${event.type}\nVenue Location: ${event.venue}\nEvent Notes: ${event.notes || 'None'}`,
      start: {
        date: startIso
      },
      end: {
        date: endIso
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 2 * 24 * 60 }, // 2 days before
        ]
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Google Calendar API error: ${response.status}`);
    }

    const createdEvent = await response.json();
    return {
      success: true,
      eventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink
    };
  } catch (err: any) {
    console.error('Error creating Google Calendar event:', err);
    return {
      success: false,
      error: err.message || 'Failed to sync with Google Calendar'
    };
  }
};

/**
 * Checks for existing events on Google Calendar for a given date to prevent double bookings
 */
export const checkCalendarConflicts = async (dateStr: string): Promise<any[]> => {
  const token = getCalendarAccessToken();
  if (!token || !dateStr) return [];

  try {
    const timeMin = new Date(`${dateStr}T00:00:00Z`).toISOString();
    const timeMax = new Date(`${dateStr}T23:59:59Z`).toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error('Error checking conflicts:', err);
    return [];
  }
};
