"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            R
          </span>
          <span className="font-display text-base font-medium tracking-tight">
            Collaboration Network
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
          ) : isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block"
              >
                Discover
              </Link>
              <Link
                href="/recommendations"
                className="hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block"
              >
                For you
              </Link>
              <Link
                href="/publications"
                className="hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block"
              >
                Papers
              </Link>
              <Link
                href="/my-projects"
                className="hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block"
              >
                Your projects
              </Link>
              <Link
                href="/my-teams"
                className="hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block"
              >
                Teams
              </Link>
              <Link
                href="/applications"
                className="hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block"
              >
                Requests
              </Link>
              <NotificationBell />
              {/* The avatar doubles as the link to your research portfolio. */}
              <Link
                href="/profile"
                title="Your research portfolio"
                aria-label="Your research portfolio"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground hover:ring-2 hover:ring-primary/40"
              >
                {getInitials(user!.fullName)}
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
