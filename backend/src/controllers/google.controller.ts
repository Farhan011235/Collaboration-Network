import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as googleModel from "../models/google.model";
import {
  GOOGLE_SCOPES,
  createOAuthClient,
  isGoogleConfigured,
  signOAuthState,
  verifyOAuthState,
} from "../config/google";
import { env } from "../config/env";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

// CONTROLLER LAYER - Google Calendar connection (Module 3 Feature 1).

// Only allow returning users to in-app paths, never an absolute URL - stops
// the redirect being turned into an open-redirect.
const safeRedirect = (path?: string): string =>
  path && path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";

// GET /google/status - does the signed-in user have a calendar connected?
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const account = await googleModel.findByUser(req.user!.userId);
  return sendSuccess(res, {
    configured: isGoogleConfigured(),
    connected: Boolean(account),
    googleEmail: account?.googleEmail ?? null,
  });
});

// GET /google/auth-url?redirect=/projects/1/meetings
// Returns the Google consent URL the frontend should send the browser to.
export const getAuthUrl = asyncHandler(async (req: Request, res: Response) => {
  if (!isGoogleConfigured()) {
    throw ApiError.badRequest(
      "Google Calendar is not configured on the server"
    );
  }

  const redirect =
    typeof req.query.redirect === "string" ? req.query.redirect : undefined;

  const client = createOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "offline", // we need a refresh token
    prompt: "consent", // force a refresh token every time
    scope: GOOGLE_SCOPES,
    include_granted_scopes: true,
    state: signOAuthState({ userId: req.user!.userId, redirect }),
  });

  return sendSuccess(res, { url });
});

// GET /google/callback - Google redirects the browser here (no JWT). We verify
// the state, exchange the code for tokens, store them, and bounce the user
// back into the app.
export const handleCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const base = env.clientUrl;
    const { code, state, error } = req.query as Record<string, string>;

    if (error || !code || !state) {
      return res.redirect(`${base}/dashboard?google=error`);
    }

    let userId: number;
    let redirect: string | undefined;
    try {
      const parsed = verifyOAuthState(state);
      userId = parsed.userId;
      redirect = parsed.redirect;
    } catch {
      return res.redirect(`${base}/dashboard?google=error`);
    }

    try {
      const client = createOAuthClient();
      const { tokens } = await client.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        // No refresh token usually means the user previously granted access;
        // sending prompt=consent above should prevent this.
        return res.redirect(
          `${base}${safeRedirect(redirect)}?google=error`
        );
      }

      // The email rides along in the id_token when the email scope is granted.
      let googleEmail: string | null = null;
      if (tokens.id_token) {
        const decoded = jwt.decode(tokens.id_token) as { email?: string } | null;
        googleEmail = decoded?.email ?? null;
      }

      await googleModel.save(userId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope ?? null,
        tokenType: tokens.token_type ?? null,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        googleEmail,
      });

      return res.redirect(`${base}${safeRedirect(redirect)}?google=connected`);
    } catch {
      return res.redirect(`${base}${safeRedirect(redirect)}?google=error`);
    }
  }
);

// DELETE /google/disconnect - forget the user's tokens.
export const disconnect = asyncHandler(async (req: Request, res: Response) => {
  await googleModel
    .remove(req.user!.userId)
    .catch(() => {
      /* already disconnected - treat as success */
    });
  return sendSuccess(res, {}, "Google Calendar disconnected");
});
