import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development",

  // Google Calendar integration (Module 3 Feature 1). Optional: the app runs
  // without these, but the "Connect Google Calendar" flow needs them.
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:4000/api/google/callback",

  // Google Gemini (Module 3 Feature 3 - Proposal Quality Assistant). Optional.
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",

  // OpenAlex (Module 3 Feature 5 - Academic Publication Search). No API key
  // exists for OpenAlex; a contact email just puts us in their faster
  // "polite pool". Entirely optional.
  openAlexMailto: process.env.OPENALEX_MAILTO || "",
};
