import Link from "next/link";
import { CollaborationGraph } from "@/components/auth/CollaborationGraph";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel: the signature element. Hidden on small screens. */}
      <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-primary p-10 lg:flex">
        <div className="absolute inset-0 bg-grid opacity-40" />

        <Link
          href="/"
          className="relative z-10 font-display text-lg font-medium text-white"
        >
          Research Collaboration Network
        </Link>

        <div className="pointer-events-none absolute inset-y-0 right-[-40px] w-[340px] opacity-90">
          <CollaborationGraph />
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="font-display text-3xl leading-snug text-white">
            Research moves faster when the right people find each other.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Post a project, list what you need, and build a team from
            researchers whose skills actually match the work.
          </p>
        </div>
      </aside>

      {/* Right panel: the form */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
