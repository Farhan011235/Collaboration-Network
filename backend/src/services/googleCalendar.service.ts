import { calendar_v3, google } from "googleapis";
import { createOAuthClient } from "../config/google";
import * as googleModel from "../models/google.model";

// SERVICE LAYER - talks to Google Calendar on a user's behalf.
// Every function is best-effort: callers keep the meeting in our own DB even
// if the Google side fails (token revoked, offline, not connected, etc.).

// Builds an OAuth client primed with a user's stored tokens. The googleapis
// client refreshes an expired access token automatically and emits "tokens";
// we persist the refreshed values so the next call starts fresh.
const authedClientFor = async (userId: number) => {
  const account = await googleModel.findByUser(userId);
  if (!account) return null;

  const client = createOAuthClient();
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    scope: account.scope ?? undefined,
    token_type: account.tokenType ?? undefined,
    expiry_date: account.expiryDate ? account.expiryDate.getTime() : undefined,
  });

  client.on("tokens", (tokens) => {
    googleModel
      .updateTokens(userId, {
        accessToken: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      })
      .catch(() => {
        /* a failed token save shouldn't break the calendar call */
      });
  });

  return client;
};

export interface CalendarEventInput {
  title: string;
  description?: string | null;
  location?: string | null;
  meetingLink?: string | null;
  startTime: Date;
  endTime: Date;
}

// Times are stored in UTC; we hand Google the ISO string with an explicit
// UTC zone so the event lands at the right instant in every attendee's
// local calendar view.
const toEvent = (m: CalendarEventInput): calendar_v3.Schema$Event => {
  const description = [
    m.description || null,
    m.meetingLink ? `Join: ${m.meetingLink}` : null,
    "Scheduled via Research & Project Collaboration Network",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    summary: m.title,
    description,
    location: m.location ?? undefined,
    start: { dateTime: m.startTime.toISOString(), timeZone: "UTC" },
    end: { dateTime: m.endTime.toISOString(), timeZone: "UTC" },
  };
};

export const isConnected = async (userId: number): Promise<boolean> =>
  Boolean(await googleModel.findByUser(userId));

// Creates the event on the user's primary calendar. Returns the Google event
// id (to store for later updates/removal), or null if it couldn't be created.
export const createEvent = async (
  userId: number,
  input: CalendarEventInput
): Promise<string | null> => {
  const client = await authedClientFor(userId);
  if (!client) return null;

  try {
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: toEvent(input),
    });
    return res.data.id ?? null;
  } catch {
    return null;
  }
};

export const updateEvent = async (
  userId: number,
  eventId: string,
  input: CalendarEventInput
): Promise<boolean> => {
  const client = await authedClientFor(userId);
  if (!client) return false;

  try {
    const calendar = google.calendar({ version: "v3", auth: client });
    await calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: toEvent(input),
    });
    return true;
  } catch {
    return false;
  }
};

export const deleteEvent = async (
  userId: number,
  eventId: string
): Promise<void> => {
  const client = await authedClientFor(userId);
  if (!client) return;

  try {
    const calendar = google.calendar({ version: "v3", auth: client });
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch {
    // Already gone (404/410) or revoked access - nothing to clean up.
  }
};
