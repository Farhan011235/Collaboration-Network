import { z } from "zod";

const collaborationTypes = ["REMOTE", "ONSITE", "HYBRID"] as const;
const importanceLevels = ["REQUIRED", "PREFERRED", "OPTIONAL"] as const;

const skillRequirement = z.object({
  skillId: z.number().int().positive(),
  importanceLevel: z.enum(importanceLevels).default("REQUIRED"),
});

export const createProjectSchema = z.object({
  title: z.string().trim().min(5, "Give the project a clear title").max(160),
  description: z
    .string()
    .trim()
    .min(30, "Describe the project in at least 30 characters")
    .max(5000),
  objectives: z.string().trim().max(3000).optional().or(z.literal("")),
  expectedOutcomes: z.string().trim().max(3000).optional().or(z.literal("")),
  researchDomain: z.string().trim().min(2, "Choose a research domain").max(120),
  collaborationType: z.enum(collaborationTypes, {
    errorMap: () => ({ message: "Choose how the team will work together" }),
  }),
  durationMonths: z
    .number()
    .int()
    .min(1, "Duration must be at least 1 month")
    .max(120, "Duration cannot exceed 120 months")
    .optional()
    .nullable(),
  teamSizeLimit: z.number().int().min(1).max(50).optional().nullable(),
  skills: z.array(skillRequirement).max(20, "Pick at most 20 skills").default([]),
});

// Every field optional on edit, but at least one must be present.
export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nothing to update",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ------------------------------------------------------------
// SEARCH & DISCOVERY   (Zunaid - Feature 2)
// ------------------------------------------------------------

const sortOptions = ["recent", "oldest", "team"] as const;

// Query params arrive as strings, so numbers are coerced and the
// comma-separated skillIds list is split into an array of ids.
// Discovery only ever browses published proposals, so there is no
// status filter here - it is fixed in the model.
export const searchProjectSchema = z
  .object({
    keyword: z.string().trim().max(160).optional(),
    researchDomain: z.string().trim().max(120).optional(),
    collaborationType: z.enum(collaborationTypes).optional(),
    skillIds: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (val === undefined) return undefined;
        const parts = Array.isArray(val) ? val : val.split(",");
        const ids = parts
          .map((p) => Number(String(p).trim()))
          .filter((n) => Number.isInteger(n) && n > 0);
        return ids.length > 0 ? Array.from(new Set(ids)) : undefined;
      }),
    minDuration: z.coerce.number().int().min(1).max(120).optional(),
    maxDuration: z.coerce.number().int().min(1).max(120).optional(),
    sort: z.enum(sortOptions).default("recent"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(12),
  })
  .refine(
    (d) =>
      d.minDuration === undefined ||
      d.maxDuration === undefined ||
      d.minDuration <= d.maxDuration,
    { message: "Minimum duration cannot exceed maximum", path: ["minDuration"] }
  );

export type SearchProjectInput = z.infer<typeof searchProjectSchema>;
