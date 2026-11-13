import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

// SERVICE LAYER - Academic Publication Search via the OpenAlex API
// (Module 3 Feature 5).
//
// OpenAlex is free and needs no API key. Supplying a contact email puts us in
// their faster "polite pool", so OPENALEX_MAILTO is set when available.

const BASE = "https://api.openalex.org/works";

// Only the fields the UI actually renders - keeps the payload small.
const SELECT = [
  "id",
  "doi",
  "display_name",
  "publication_year",
  "publication_date",
  "cited_by_count",
  "authorships",
  "primary_location",
  "open_access",
  "type",
  "abstract_inverted_index",
].join(",");

export type PublicationSort = "relevance" | "citations" | "newest";

export interface PublicationSearchParams {
  query: string;
  page: number;
  perPage: number;
  fromYear?: number;
  toYear?: number;
  openAccessOnly?: boolean;
  sort: PublicationSort;
}

export interface PublicationAuthor {
  name: string;
  institution?: string | null;
}

export interface Publication {
  openAlexId: string;
  title: string;
  doi?: string | null;
  doiUrl?: string | null;
  year?: number | null;
  publicationDate?: string | null;
  citationCount: number;
  authors: PublicationAuthor[];
  venue?: string | null;
  type?: string | null;
  isOpenAccess: boolean;
  openAccessUrl?: string | null;
  landingPageUrl?: string | null;
  abstract?: string | null;
}

// OpenAlex ships abstracts as an inverted index ({word: [positions]}), so we
// rebuild the running text from it.
const rebuildAbstract = (
  inverted?: Record<string, number[]> | null
): string | null => {
  if (!inverted) return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) words[pos] = word;
  }
  const text = words.filter(Boolean).join(" ").trim();
  if (!text) return null;
  // Abstracts can be very long; keep a readable snippet.
  return text.length > 1200 ? `${text.slice(0, 1200)}…` : text;
};

const SORT_PARAM: Record<PublicationSort, string | undefined> = {
  relevance: undefined, // OpenAlex defaults to relevance when `search` is set
  citations: "cited_by_count:desc",
  newest: "publication_date:desc",
};

const normalize = (raw: any): Publication => {
  const primary = raw?.primary_location ?? {};
  const source = primary?.source ?? {};
  const oa = raw?.open_access ?? {};

  const authors: PublicationAuthor[] = (raw?.authorships ?? [])
    .map((a: any) => ({
      name: a?.author?.display_name ?? "",
      institution: a?.institutions?.[0]?.display_name ?? null,
    }))
    .filter((a: PublicationAuthor) => a.name);

  // OpenAlex returns the DOI as a full URL; keep both forms.
  const doiUrl: string | null = raw?.doi ?? null;
  const doi = doiUrl ? doiUrl.replace(/^https?:\/\/doi\.org\//, "") : null;

  return {
    openAlexId: String(raw?.id ?? "").replace("https://openalex.org/", ""),
    title: raw?.display_name ?? "Untitled",
    doi,
    doiUrl,
    year: raw?.publication_year ?? null,
    publicationDate: raw?.publication_date ?? null,
    citationCount: raw?.cited_by_count ?? 0,
    authors,
    venue: source?.display_name ?? null,
    type: raw?.type ?? null,
    isOpenAccess: Boolean(oa?.is_oa),
    openAccessUrl: oa?.oa_url ?? null,
    landingPageUrl: primary?.landing_page_url ?? doiUrl ?? null,
    abstract: rebuildAbstract(raw?.abstract_inverted_index),
  };
};

const fetchJson = async (url: string): Promise<any> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  let res: Response;
  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } catch (err: any) {
    clearTimeout(timeout);
    throw err?.name === "AbortError"
      ? ApiError.badRequest("The publication search timed out. Try again.")
      : ApiError.badRequest("Could not reach the publication service");
  }
  clearTimeout(timeout);

  if (!res.ok) {
    if (res.status === 429) {
      throw ApiError.badRequest(
        "The publication service is rate limiting us. Try again shortly."
      );
    }
    if (res.status === 404) {
      throw ApiError.notFound("Publication not found");
    }
    throw ApiError.badRequest("Publication search failed");
  }

  return res.json();
};

export const searchPublications = async (params: PublicationSearchParams) => {
  const url = new URL(BASE);
  url.searchParams.set("search", params.query);
  url.searchParams.set("select", SELECT);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("per-page", String(params.perPage));

  // OpenAlex takes filters as one comma-separated list.
  const filters: string[] = [];
  if (params.fromYear && params.toYear) {
    filters.push(`publication_year:${params.fromYear}-${params.toYear}`);
  } else if (params.fromYear) {
    filters.push(`publication_year:>${params.fromYear - 1}`);
  } else if (params.toYear) {
    filters.push(`publication_year:<${params.toYear + 1}`);
  }
  if (params.openAccessOnly) filters.push("is_oa:true");
  if (filters.length) url.searchParams.set("filter", filters.join(","));

  const sort = SORT_PARAM[params.sort];
  if (sort) url.searchParams.set("sort", sort);

  if (env.openAlexMailto) url.searchParams.set("mailto", env.openAlexMailto);

  const data = await fetchJson(url.toString());

  const total: number = data?.meta?.count ?? 0;
  return {
    publications: (data?.results ?? []).map(normalize),
    total,
    page: params.page,
    perPage: params.perPage,
    // OpenAlex caps deep paging; 200 pages is far beyond practical use.
    totalPages: Math.min(200, Math.max(1, Math.ceil(total / params.perPage))),
  };
};

// A single work, for the detail view. Accepts a bare OpenAlex id (W123...).
export const getPublication = async (openAlexId: string): Promise<Publication> => {
  const url = new URL(`${BASE}/${openAlexId}`);
  url.searchParams.set("select", SELECT);
  if (env.openAlexMailto) url.searchParams.set("mailto", env.openAlexMailto);

  return normalize(await fetchJson(url.toString()));
};
