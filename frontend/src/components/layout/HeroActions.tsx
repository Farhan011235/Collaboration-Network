"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// The hero call-to-action. Signed-out visitors are asked to join;
// signed-in users are sent straight into the product.
export function HeroActions() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Reserve the space so the layout doesn't jump once auth resolves.
    return <div className="mt-9 h-11 w-72 animate-pulse rounded-md bg-muted" />;
  }

  if (isAuthenticated) {
    return (
      <div className="mt-9 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/projects">Discover projects</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-9 flex flex-wrap gap-3">
      <Button asChild size="lg">
        <Link href="/register">Create an account</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/login">Sign in</Link>
      </Button>
    </div>
  );
}
