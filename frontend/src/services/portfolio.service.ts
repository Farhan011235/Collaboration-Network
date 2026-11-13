import api from "@/lib/axios";
import type {
  ApiResponse,
  EducationEntry,
  EducationFormValues,
  ExperienceEntry,
  ExperienceFormValues,
  Portfolio,
  ProfileFormValues,
  ProficiencyLevel,
  PublicationEntry,
  PublicationFormValues,
  Publication as SearchedPublication,
} from "@/types";

// Research Portfolio API calls (Module 1 Feature 4).

export const getMyPortfolio = async (): Promise<Portfolio> => {
  const res = await api.get<ApiResponse<{ portfolio: Portfolio }>>(
    "/portfolio/me"
  );
  return res.data.data.portfolio;
};

export const getUserPortfolio = async (userId: number): Promise<Portfolio> => {
  const res = await api.get<ApiResponse<{ portfolio: Portfolio }>>(
    `/portfolio/user/${userId}`
  );
  return res.data.data.portfolio;
};

export const updateProfile = async (
  data: ProfileFormValues
): Promise<void> => {
  await api.patch("/portfolio/profile", data);
};

/* ---------- skills & interests ---------- */

export const addSkill = async (
  skillId: number,
  proficiencyLevel: ProficiencyLevel
): Promise<void> => {
  await api.post("/portfolio/skills", { skillId, proficiencyLevel });
};

export const removeSkill = async (skillId: number): Promise<void> => {
  await api.delete(`/portfolio/skills/${skillId}`);
};

export const addInterest = async (interestId: number): Promise<void> => {
  await api.post("/portfolio/interests", { interestId });
};

export const removeInterest = async (interestId: number): Promise<void> => {
  await api.delete(`/portfolio/interests/${interestId}`);
};

/* ---------- education ---------- */

export const addEducation = async (
  data: EducationFormValues
): Promise<EducationEntry> => {
  const res = await api.post<ApiResponse<{ education: EducationEntry }>>(
    "/portfolio/education",
    data
  );
  return res.data.data.education;
};

export const updateEducation = async (
  educationId: number,
  data: Partial<EducationFormValues>
): Promise<void> => {
  await api.patch(`/portfolio/education/${educationId}`, data);
};

export const deleteEducation = async (educationId: number): Promise<void> => {
  await api.delete(`/portfolio/education/${educationId}`);
};

/* ---------- publications ---------- */

export const addPublication = async (
  data: PublicationFormValues
): Promise<PublicationEntry> => {
  const res = await api.post<ApiResponse<{ publication: PublicationEntry }>>(
    "/portfolio/publications",
    data
  );
  return res.data.data.publication;
};

// Saves a work found via the OpenAlex search straight to the portfolio.
export const importPublication = async (
  pub: SearchedPublication
): Promise<void> => {
  await api.post("/portfolio/publications/import", {
    openAlexId: pub.openAlexId,
    title: pub.title,
    authors: pub.authors.map((a) => a.name).join(", ") || undefined,
    venue: pub.venue || undefined,
    doi: pub.doi || undefined,
    year: pub.year ?? undefined,
    citationCount: pub.citationCount,
  });
};

export const updatePublication = async (
  publicationId: number,
  data: Partial<PublicationFormValues>
): Promise<void> => {
  await api.patch(`/portfolio/publications/${publicationId}`, data);
};

export const deletePublication = async (
  publicationId: number
): Promise<void> => {
  await api.delete(`/portfolio/publications/${publicationId}`);
};

/* ---------- previous project experience ---------- */

export const addExperience = async (
  data: ExperienceFormValues
): Promise<ExperienceEntry> => {
  const res = await api.post<ApiResponse<{ experience: ExperienceEntry }>>(
    "/portfolio/experiences",
    data
  );
  return res.data.data.experience;
};

export const updateExperience = async (
  experienceId: number,
  data: Partial<ExperienceFormValues>
): Promise<void> => {
  await api.patch(`/portfolio/experiences/${experienceId}`, data);
};

export const deleteExperience = async (experienceId: number): Promise<void> => {
  await api.delete(`/portfolio/experiences/${experienceId}`);
};
