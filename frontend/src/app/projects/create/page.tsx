"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ProjectForm } from "@/components/projects/ProjectForm";

export default function CreateProjectPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-3xl flex-1 py-10">
          <Link
            href="/my-projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Your projects
          </Link>

          <header className="mb-8 mt-4">
            <h1 className="font-display text-3xl font-medium tracking-tight">
              New research project
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Describe the work and the skills you need. Nothing is public until
              you publish it.
            </p>
          </header>

          <ProjectForm />
        </main>
      </div>
    </ProtectedRoute>
  );
}
