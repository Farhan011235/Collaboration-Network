import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { env } from "./env";

// Google OAuth 2.0 + Calendar configuration (Module 3 Feature 1).

// We only need to manage the user's own calendar events.
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

// The feature is only usable once these env vars are set. The rest of the app
// keeps working without them.
export const isGoogleConfigured = (): boolean =>
  Boolean(env.googleClientId && env.googleClientSecret && env.googleRedirectUri);

// A fresh OAuth2 client. One per request/user so credentials never leak
// between users.
export const createOAuthClient = () =>
  new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );

// The OAuth callback is a plain redirect from Google with no JWT, so we carry
// the user (and where to send them back) in a short-lived signed `state`.
export interface OAuthState {
  userId: number;
  redirect?: string;
}

export const signOAuthState = (state: OAuthState): string =>
  jwt.sign(state, env.jwtSecret, { expiresIn: "15m" });

export const verifyOAuthState = (token: string): OAuthState =>
  jwt.verify(token, env.jwtSecret) as OAuthState;
