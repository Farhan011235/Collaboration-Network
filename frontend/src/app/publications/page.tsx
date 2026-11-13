"use client";

import { useCallback, useState } from "react";
import { Search, Loader2, BookOpen, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import * as publicationService from "@/services/publication.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicationCard } from "@/components/publications/PublicationCard";
import type {
  Publication,
  PublicationSearchFilters,
  PublicationSort,
} from "@/types";

const PER_PAGE = 10;

export default function PublicationSearchPage() {
  const [queryInput, setQueryInput] = useState("");
  const [filters, setFilters] = useState<PublicationSearchFilters>({
    query: "",
    sort: "relevance",
    page: 1,
    perPage: PER_PAGE,
  });
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<Publication[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Publication search hits an external API, so it runs on submit rather than
  // on every keystroke.
  const run = useCallback(async (next: PublicationSearchFilters) => {
    if (next.query.trim().length < 2) {
      toast.error("Enter at least 2 characters to search");
      return;
    }
    setLoading(true);
    try {
      const res = await publicationService.searchPublications(next);
      setResults(res.publications);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setFilters(next);
      setSearched(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run({ ...filters, query: queryInput, page: 1 });
  };

  const patch = (patchValues: Partial<PublicationSearchFilters>) =>
    run({ ...filters, ...patchValues, query: queryInput || filters.query, page: 1 });

  const goToPage = (page: number) => run({ ...filters, page });

  const page = filters.page ?? 1;

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-4xl flex-1 py-10">
          <div>
            <h1 className="inline-flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
              <BookOpen className="h-6 w-6 text-primary" />
              Publication search
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Search millions of academic works and retrieve their metadata, DOI,
              authors and citation counts. Powered by OpenAlex.
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={submit} className="mt-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="e.g. bengali speech recognition"
                className="h-12 pl-10 pr-28 text-base"
              />
              <Button
                type="submit"
                size="sm"
                loading={loading}
                className="absolute right-2 top-2"
              >
                Search
              </Button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((s) => !s)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>

            {searched && !loading && (
              <p className="text-sm text-muted-foreground">
                {total.toLocaleString()} {total === 1 ? "result" : "results"}
              </p>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort</span>
              <Select
                value={filters.sort ?? "relevance"}
                onChange={(e) =>
                  patch({ sort: e.target.value as PublicationSort })
                }
                className="h-9 w-40"
                disabled={!searched}
              >
                <option value="relevance">Most relevant</option>
                <option value="citations">Most cited</option>
                <option value="newest">Newest first</option>
              </Select>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="fromYear">From year</Label>
                <Input
                  id="fromYear"
                  type="number"
                  placeholder="2015"
                  defaultValue={filters.fromYear ?? ""}
                  onBlur={(e) =>
                    patch({
                      fromYear: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toYear">To year</Label>
                <Input
                  id="toYear"
                  type="number"
                  placeholder="2026"
                  defaultValue={filters.toYear ?? ""}
                  onBlur={(e) =>
                    patch({
                      toYear: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oa">Access</Label>
                <label
                  htmlFor="oa"
                  className="flex h-10 cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    id="oa"
                    type="checkbox"
                    checked={!!filters.openAccessOnly}
                    onChange={(e) => patch({ openAccessOnly: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  Open access only
                </label>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !searched ? (
              <EmptyState
                icon={BookOpen}
                title="Search academic publications"
                body="Look up papers by topic, title or author to see their authors, venue, DOI and citation counts."
              />
            ) : results.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No publications found"
                body="Try a broader query, or clear the year and open-access filters."
              />
            ) : (
              <>
                <div className="space-y-3">
                  {results.map((pub) => (
                    <PublicationCard key={pub.openAlexId} publication={pub} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => goToPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages.toLocaleString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => goToPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
