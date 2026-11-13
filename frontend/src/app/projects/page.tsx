"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, Loader2, Compass } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import * as projectService from "@/services/project.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { useLivePoll } from "@/hooks/useLivePoll";
import type {
  Project,
  ProjectSearchFilters,
  ProjectSortOption,
} from "@/types";

const PAGE_SIZE = 12;

const emptyFilters: ProjectSearchFilters = {
  sort: "recent",
  page: 1,
  pageSize: PAGE_SIZE,
};

export default function DiscoverProjectsPage() {
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState<ProjectSearchFilters>(emptyFilters);
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce the keyword so we don't fire a request on every keystroke.
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    debounce.current = setTimeout(() => {
      setFilters((f) => ({ ...f, keyword: keyword.trim() || undefined, page: 1 }));
    }, 350);
    return () => clearTimeout(debounce.current);
  }, [keyword]);

  useEffect(() => {
    setLoading(true);
    projectService
      .searchProjects(filters)
      .then((res) => {
        setProjects(res.projects);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [filters]);

  // Silent background refresh of the current search, so projects that
  // teammates publish appear without a manual reload. Reuses the active
  // filters/page and never toggles the loading spinner.
  const refresh = useCallback(async () => {
    try {
      const res = await projectService.searchProjects(filters);
      setProjects(res.projects);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      // Ignore transient poll failures; the next tick retries.
    }
  }, [filters]);

  useLivePoll(refresh);

  // Filter changes reset back to the first page.
  const patchFilters = useCallback((patch: Partial<ProjectSearchFilters>) => {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }, []);

  // Paging keeps the current filters and only moves the page.
  const goToPage = useCallback((next: number) => {
    setFilters((f) => ({ ...f, page: next }));
  }, []);

  const clearFilters = useCallback(() => {
    setKeyword("");
    setFilters({ ...emptyFilters });
  }, []);

  const page = filters.page ?? 1;

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container flex-1 py-10">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight">
              Discover projects
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Search open research proposals and request to collaborate.
            </p>
          </div>

          {/* Keyword search */}
          <div className="relative mt-6">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by title, description or domain"
              className="h-12 pl-10 text-base"
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters((s) => !s)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>

            <p className="hidden text-sm text-muted-foreground lg:block">
              {loading
                ? "Searching…"
                : `${total} ${total === 1 ? "project" : "projects"} found`}
            </p>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort</span>
              <Select
                value={filters.sort ?? "recent"}
                onChange={(e) =>
                  patchFilters({ sort: e.target.value as ProjectSortOption })
                }
                className="h-9 w-40"
              >
                <option value="recent">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="team">Largest team</option>
              </Select>
            </div>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
            {/* Filter sidebar */}
            <aside
              className={cn(
                "lg:block",
                showFilters ? "block" : "hidden"
              )}
            >
              <div className="lg:sticky lg:top-24">
                <ProjectFilters
                  value={filters}
                  onChange={patchFilters}
                  onClear={clearFilters}
                />
              </div>
            </aside>

            {/* Results */}
            <section>
              {loading ? (
                <div className="flex justify-center py-24">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : projects.length === 0 ? (
                <EmptyState
                  icon={Compass}
                  title="No matching projects"
                  body="Try broadening your search or clearing some filters."
                />
              ) : (
                <>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {projects.map((project) => (
                      <ProjectCard key={project.projectId} project={project} />
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
                        Page {page} of {totalPages}
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
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
