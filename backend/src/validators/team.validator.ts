import { z } from "zod";

// Module 2 Feature 4 - Team Responsibility Management.

// OWNER is deliberately excluded: it is not a responsibility an owner hands
// out, it is who created the project.
const assignableRoles = [
  "RESEARCH_LEAD",
  "DEVELOPER",
  "DATA_ANALYST",
  "WRITER",
  "MEMBER",
] as const;

export const updateRoleSchema = z
  .object({
    role: z.enum(assignableRoles, {
      errorMap: () => ({ message: "Choose a valid project role" }),
    }),
    responsibilities: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nothing to update" });

export const updateEvaluationSchema = z
  .object({
    contributionScore: z
      .preprocess(
        (v) => (v === "" || v == null ? null : v),
        z.coerce
          .number()
          .int()
          .min(0, "Score must be between 0 and 100")
          .max(100, "Score must be between 0 and 100")
          .nullable()
      )
      .optional(),
    contributionNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Nothing to update" });

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;
