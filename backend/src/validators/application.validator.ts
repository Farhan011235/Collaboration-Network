import { z } from "zod";

// A researcher's request to collaborate on a project (Zunaid - Feature 2).
// The reviewing/accept-reject side belongs to Feature 3 (Fahad).
export const createApplicationSchema = z.object({
  projectId: z.number().int().positive(),
  message: z
    .string()
    .trim()
    .max(1000, "Keep your message under 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

// Owner's decision on a request (Fahad - Feature 3).
export const reviewApplicationSchema = z.object({
  decision: z.enum(["ACCEPT", "REJECT"], {
    errorMap: () => ({ message: "Decision must be accept or reject" }),
  }),
  reviewNote: z
    .string()
    .trim()
    .max(1000, "Keep your note under 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;
