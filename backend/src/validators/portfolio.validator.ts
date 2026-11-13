import { z } from "zod";

// Module 1 Feature 4 - Research Portfolio Management.

const YEAR_MIN = 1900;
const YEAR_MAX = 2100;
const year = z.coerce.number().int().min(YEAR_MIN).max(YEAR_MAX);
const optionalYear = z
  .preprocess((v) => (v === "" || v == null ? null : v), year.nullable())
  .optional();

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

/* ---------- profile ---------- */

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    bio: optionalText(2000),
    institution: optionalText(150),
    designation: optionalText(100),
    // ORCID iDs look like 0000-0002-1825-0097 (final char may be X).
    orcidId: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i, "Use the format 0000-0002-1825-0097")
      .optional()
      .or(z.literal("")),
    websiteUrl: z
      .string()
      .trim()
      .url("Enter a valid URL (including https://)")
      .max(300)
      .optional()
      .or(z.literal("")),
    openToCollaboration: z.boolean().optional(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nothing to update" });

/* ---------- skills & interests ---------- */

export const addSkillSchema = z.object({
  skillId: z.number().int().positive(),
  proficiencyLevel: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .default("INTERMEDIATE"),
});

export const addInterestSchema = z.object({
  interestId: z.number().int().positive(),
});

/* ---------- education ---------- */

export const educationSchema = z
  .object({
    degree: z.string().trim().min(2, "Enter the degree").max(120),
    fieldOfStudy: z.string().trim().min(2, "Enter the field of study").max(120),
    institution: z.string().trim().min(2, "Enter the institution").max(150),
    startYear: optionalYear,
    endYear: optionalYear,
  })
  .superRefine((d, ctx) => {
    if (d.startYear && d.endYear && d.endYear < d.startYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End year cannot be before start year",
        path: ["endYear"],
      });
    }
  });

export const updateEducationSchema = z
  .object({
    degree: z.string().trim().min(2).max(120),
    fieldOfStudy: z.string().trim().min(2).max(120),
    institution: z.string().trim().min(2).max(150),
    startYear: optionalYear,
    endYear: optionalYear,
  })
  .partial()
  .superRefine((d, ctx) => {
    if (Object.keys(d).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nothing to update" });
    }
    if (d.startYear && d.endYear && d.endYear < d.startYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End year cannot be before start year",
        path: ["endYear"],
      });
    }
  });

/* ---------- publications ---------- */

export const publicationSchema = z.object({
  title: z.string().trim().min(3, "Enter the publication title").max(300),
  authors: optionalText(500),
  venue: optionalText(200),
  doi: optionalText(120),
  year: optionalYear,
  citationCount: z.coerce.number().int().min(0).max(1_000_000).optional(),
});

export const updatePublicationSchema = publicationSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nothing to update" });

// Importing a work straight from the OpenAlex search (Module 3 Feature 5).
export const importPublicationSchema = z.object({
  openAlexId: z.string().trim().regex(/^W\d+$/i, "Invalid OpenAlex id"),
  title: z.string().trim().min(3).max(300),
  authors: optionalText(500),
  venue: optionalText(200),
  doi: optionalText(120),
  year: optionalYear,
  citationCount: z.coerce.number().int().min(0).max(10_000_000).optional(),
});

/* ---------- previous project experience ---------- */

export const experienceSchema = z
  .object({
    title: z.string().trim().min(3, "Enter the project title").max(200),
    description: optionalText(2000),
    role: optionalText(120),
    organization: optionalText(150),
    startYear: optionalYear,
    endYear: optionalYear,
  })
  .superRefine((d, ctx) => {
    if (d.startYear && d.endYear && d.endYear < d.startYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End year cannot be before start year",
        path: ["endYear"],
      });
    }
  });

export const updateExperienceSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: optionalText(2000),
    role: optionalText(120),
    organization: optionalText(150),
    startYear: optionalYear,
    endYear: optionalYear,
  })
  .partial()
  .superRefine((d, ctx) => {
    if (Object.keys(d).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nothing to update" });
    }
    if (d.startYear && d.endYear && d.endYear < d.startYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End year cannot be before start year",
        path: ["endYear"],
      });
    }
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddSkillInput = z.infer<typeof addSkillSchema>;
export type AddInterestInput = z.infer<typeof addInterestSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type PublicationInput = z.infer<typeof publicationSchema>;
export type ImportPublicationInput = z.infer<typeof importPublicationSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
