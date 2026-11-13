import prisma from "../config/prisma";

// MODEL LAYER - all database access for a user's Google connection.
// Tokens are secrets: nothing here is ever returned to the client directly.

export const findByUser = (userId: number) =>
  prisma.googleAccount.findUnique({ where: { userId } });

interface SaveTokensInput {
  accessToken: string;
  refreshToken: string;
  scope?: string | null;
  tokenType?: string | null;
  expiryDate?: Date | null;
  googleEmail?: string | null;
}

// Called after the OAuth exchange - creates or replaces the whole connection.
export const save = (userId: number, data: SaveTokensInput) =>
  prisma.googleAccount.upsert({
    where: { userId },
    update: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      scope: data.scope ?? null,
      tokenType: data.tokenType ?? null,
      expiryDate: data.expiryDate ?? null,
      googleEmail: data.googleEmail ?? null,
    },
    create: {
      userId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      scope: data.scope ?? null,
      tokenType: data.tokenType ?? null,
      expiryDate: data.expiryDate ?? null,
      googleEmail: data.googleEmail ?? null,
    },
  });

// A silent refresh returns a new access token (and sometimes a new refresh
// token). Only overwrite the refresh token when Google actually sends one.
export const updateTokens = (
  userId: number,
  data: {
    accessToken?: string | null;
    refreshToken?: string | null;
    expiryDate?: Date | null;
  }
) =>
  prisma.googleAccount.update({
    where: { userId },
    data: {
      ...(data.accessToken ? { accessToken: data.accessToken } : {}),
      ...(data.refreshToken ? { refreshToken: data.refreshToken } : {}),
      ...(data.expiryDate !== undefined ? { expiryDate: data.expiryDate } : {}),
    },
  });

export const remove = (userId: number) =>
  prisma.googleAccount.delete({ where: { userId } });
