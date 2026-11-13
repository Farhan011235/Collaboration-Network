import api from "@/lib/axios";
import type {
  ApiResponse,
  Publication,
  PublicationSearchFilters,
  PublicationSearchResult,
} from "@/types";

// Academic Publication Search API calls (Module 3 Feature 5).
// The backend proxies OpenAlex, so no key or CORS handling is needed here.

export const searchPublications = async (
  filters: PublicationSearchFilters
): Promise<PublicationSearchResult> => {
  const params: Record<string, string | number | boolean> = {
    query: filters.query.trim(),
    page: filters.page ?? 1,
    perPage: filters.perPage ?? 10,
    sort: filters.sort ?? "relevance",
  };
  if (filters.fromYear) params.fromYear = filters.fromYear;
  if (filters.toYear) params.toYear = filters.toYear;
  if (filters.openAccessOnly) params.openAccessOnly = true;

  const res = await api.get<ApiResponse<PublicationSearchResult>>(
    "/publications/search",
    { params }
  );
  return res.data.data;
};

export const getPublication = async (
  openAlexId: string
): Promise<Publication> => {
  const res = await api.get<ApiResponse<{ publication: Publication }>>(
    `/publications/${openAlexId}`
  );
  return res.data.data.publication;
};
