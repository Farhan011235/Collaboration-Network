"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

// Home for signed-in users - quick links into their projects and portfolio.
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container flex-1 py-12">
          <h1 className="font-display text-3xl font-medium tracking-tight">
            Welcome, {user?.fullName.split(" ")[0]}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pick up your research projects, teams and portfolio.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/profile" className="block">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="pt-6">
                  <CardTitle>Your profile</CardTitle>
                  <CardDescription className="mt-2">
                    {user?.institution || "No institution added yet"}
                    {user?.designation ? ` · ${user.designation}` : ""}
                  </CardDescription>
                  <p className="mt-4 text-sm text-muted-foreground">{user?.email}</p>
                  <p className="mt-3 text-sm text-primary">
                    Edit your research portfolio →
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/my-projects" className="block">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="pt-6">
                  <CardTitle>Your projects</CardTitle>
                  <CardDescription className="mt-2">
                    Create, publish and archive your research proposals.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
