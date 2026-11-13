import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

// SERVICE LAYER - Proposal Quality Assistant (Module 3 Feature 3).
// Sends the proposal to Google Gemini and returns structured, constructive
// feedback on clarity, completeness, and structure.

export const isGeminiConfigured = (): boolean => Boolean(env.geminiApiKey);

export interface ProposalInput {
  title: string;
  description: string;
  objectives?: string | null;
  expectedOutcomes?: string | null;
  researchDomain: string;
  collaborationType: string;
  durationMonths?: number | null;
  skills: string[];
}

export interface DimensionFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface ProposalAnalysis {
  overallScore: number;
  summary: string;
  clarity: DimensionFeedback;
  completeness: DimensionFeedback;
  structure: DimensionFeedback;
  strengths: string[];
}

// JSON shape we force Gemini to return, so parsing is reliable.
const dimensionSchema = {
  type: "OBJECT",
  properties: {
    score: { type: "INTEGER" },
    feedback: { type: "STRING" },
    suggestions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["score", "feedback", "suggestions"],
};

const responseSchema = {
  type: "OBJECT",
  properties: {
    overallScore: { type: "INTEGER" },
    summary: { type: "STRING" },
    clarity: dimensionSchema,
    completeness: dimensionSchema,
    structure: dimensionSchema,
    strengths: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "overallScore",
    "summary",
    "clarity",
    "completeness",
    "structure",
    "strengths",
  ],
};

const buildPrompt = (p: ProposalInput): string => `You are an expert reviewer of academic research project proposals on a research collaboration platform. Analyze the proposal below and give constructive, specific feedback to improve it BEFORE it is published.

Score each of these three dimensions from 0 to 100:
- clarity: is the writing clear, precise, and free of vague or filler language?
- completeness: are the objectives, scope, expected outcomes, required skills and context all present and detailed enough for a collaborator to understand the project?
- structure: is it well-organized and logically ordered, with each field used appropriately?

Also give an overall score (0-100), a one-sentence summary, and a short list of the proposal's genuine strengths.

Rules:
- Base everything ONLY on the content provided. Do not invent facts about the project.
- Each dimension must include 1 to 4 concrete, actionable suggestions.
- If a field is empty or thin, treat that as a completeness gap and say what to add.
- Keep each suggestion to one sentence.

PROPOSAL
Title: ${p.title}
Research domain: ${p.researchDomain}
Collaboration type: ${p.collaborationType}
Expected duration (months): ${p.durationMonths ?? "not specified"}
Required skills: ${p.skills.length ? p.skills.join(", ") : "none listed"}

Description:
${p.description || "(empty)"}

Objectives:
${p.objectives || "(empty)"}

Expected outcomes:
${p.expectedOutcomes || "(empty)"}`;

const clampScore = (n: unknown): number => {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v));
};

const cleanDimension = (d: any): DimensionFeedback => ({
  score: clampScore(d?.score),
  feedback: String(d?.feedback ?? ""),
  suggestions: Array.isArray(d?.suggestions)
    ? d.suggestions.map((s: unknown) => String(s)).filter(Boolean).slice(0, 6)
    : [],
});

export const analyzeProposal = async (
  input: ProposalInput
): Promise<ProposalAnalysis> => {
  if (!isGeminiConfigured()) {
    throw ApiError.badRequest(
      "Proposal assistant is not configured on the server"
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  // Gemini regularly answers 503 "high demand" / 429 rate-limit on the free
  // tier, so retry a couple of times with a short backoff before giving up.
  const MAX_ATTEMPTS = 3;
  let res!: Response;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body,
      });
    } catch (err: any) {
      clearTimeout(timeout);
      if (attempt === MAX_ATTEMPTS) {
        throw err?.name === "AbortError"
          ? ApiError.badRequest("The assistant timed out. Try again.")
          : ApiError.badRequest("Could not reach the proposal assistant");
      }
      await new Promise((r) => setTimeout(r, attempt * 1500));
      continue;
    }
    clearTimeout(timeout);

    // Transient: the model is busy or we're being rate limited.
    if ((res.status === 503 || res.status === 429) && attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, attempt * 1500));
      continue;
    }
    break;
  }

  if (!res.ok) {
    // Surface Gemini's message (e.g. bad key, retired model) without leaking the key.
    let detail = "";
    try {
      const errBody = (await res.json()) as any;
      detail = errBody?.error?.message ? `: ${errBody.error.message}` : "";
    } catch {
      /* ignore */
    }
    if (res.status === 503 || res.status === 429) {
      throw ApiError.badRequest(
        "The assistant is busy right now. Try again in a moment."
      );
    }
    throw ApiError.badRequest(`Proposal assistant error${detail}`);
  }

  const data = (await res.json()) as any;
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw ApiError.badRequest("The assistant returned no analysis");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw ApiError.badRequest("The assistant returned an unreadable analysis");
  }

  return {
    overallScore: clampScore(parsed.overallScore),
    summary: String(parsed.summary ?? ""),
    clarity: cleanDimension(parsed.clarity),
    completeness: cleanDimension(parsed.completeness),
    structure: cleanDimension(parsed.structure),
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.map((s: unknown) => String(s)).filter(Boolean).slice(0, 6)
      : [],
  };
};
