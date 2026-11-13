"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  FileText,
  Download,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import * as projectService from "@/services/project.service";
import * as documentService from "@/services/document.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { useLivePoll } from "@/hooks/useLivePoll";
import type { ProjectDocument } from "@/types";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = Number(params.id);

  const [title, setTitle] = useState("");
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ open: boolean; editing?: ProjectDocument }>(
    { open: false }
  );

  useEffect(() => {
    if (!Number.isInteger(projectId)) return;
    Promise.all([
      projectService.getProject(projectId),
      documentService.getDocuments(projectId),
    ])
      .then(([project, docs]) => {
        setTitle(project.title);
        setDocuments(docs);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  // Silent background refresh so new uploads/versions from teammates appear
  // without a manual reload.
  const refresh = useCallback(async () => {
    if (!Number.isInteger(projectId)) return;
    try {
      setDocuments(await documentService.getDocuments(projectId));
    } catch {
      // Ignore transient poll failures; the next tick retries.
    }
  }, [projectId]);

  useLivePoll(refresh, { enabled: Number.isInteger(projectId) });

  // Organize: group documents by their category.
  const groups = useMemo(() => {
    const map = new Map<string, ProjectDocument[]>();
    for (const doc of documents) {
      const key = doc.category?.trim() || "Uncategorized";
      const arr = map.get(key) ?? [];
      arr.push(doc);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [documents]);

  const onSaved = (doc: ProjectDocument, isNew: boolean) => {
    setDocuments((prev) =>
      isNew
        ? [doc, ...prev]
        : prev.map((d) => (d.documentId === doc.documentId ? doc : d))
    );
    setForm({ open: false });
  };

  const download = async (doc: ProjectDocument) => {
    setDownloadingId(doc.documentId);
    try {
      await documentService.downloadDocument(doc.documentId, doc.originalName);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  const remove = async (doc: ProjectDocument) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    try {
      await documentService.deleteDocument(doc.documentId);
      setDocuments((prev) => prev.filter((d) => d.documentId !== doc.documentId));
      toast.success("Document deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-3xl flex-1 py-10">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Link
                href={`/projects/${projectId}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to project
              </Link>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-medium tracking-tight">
                    Documents
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{title}</p>
                </div>
                {!form.open && (
                  <Button size="sm" onClick={() => setForm({ open: true })}>
                    <Plus className="h-4 w-4" />
                    Upload document
                  </Button>
                )}
              </div>

              {form.open && (
                <div className="mt-6">
                  <DocumentForm
                    projectId={projectId}
                    existing={form.editing}
                    onSaved={onSaved}
                    onCancel={() => setForm({ open: false })}
                  />
                </div>
              )}

              <div className="mt-8">
                {documents.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No documents yet"
                    body="Upload papers, datasets, notes and other files to share with the team."
                  />
                ) : (
                  <div className="space-y-8">
                    {groups.map(([category, docs]) => (
                      <section key={category}>
                        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                          {category}
                        </h2>
                        <ul className="space-y-2">
                          {docs.map((doc) => (
                            <li
                              key={doc.documentId}
                              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                            >
                              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="truncate text-sm font-medium">
                                    {doc.title}
                                  </h3>
                                  {doc.version > 1 && (
                                    <Badge variant="muted">v{doc.version}</Badge>
                                  )}
                                </div>
                                {doc.description && (
                                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                    {doc.description}
                                  </p>
                                )}
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-accent-foreground">
                                      {getInitials(doc.uploader.fullName)}
                                    </span>
                                    {doc.uploader.fullName}
                                  </span>
                                  <span>{formatBytes(doc.sizeBytes)}</span>
                                  <span className="truncate">
                                    {doc.originalName}
                                  </span>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => download(doc)}
                                  disabled={downloadingId === doc.documentId}
                                  aria-label="Download"
                                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                                >
                                  {downloadingId === doc.documentId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </button>
                                {user?.userId === doc.uploaderId && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setForm({ open: true, editing: doc })
                                      }
                                      aria-label="Edit"
                                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => remove(doc)}
                                      aria-label="Delete"
                                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
