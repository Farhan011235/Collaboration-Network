import { Search, Users, ClipboardList } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroActions } from "@/components/layout/HeroActions";

const steps = [
  {
    icon: ClipboardList,
    title: "Post what you are working on",
    body: "Describe the project, the research domain, and the skills your team is missing.",
  },
  {
    icon: Search,
    title: "Find projects that fit",
    body: "Filter by domain, required skills, collaboration type and duration.",
  },
  {
    icon: Users,
    title: "Build the team",
    body: "Review who applied, check their portfolio, and accept the right collaborators.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className="container relative py-24 lg:py-32">
            <div className="max-w-2xl animate-fade-up">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
                For researchers and students
              </p>
              <h1 className="mt-5 font-display text-5xl font-medium leading-[1.08] tracking-tight lg:text-6xl">
                Good research needs the{" "}
                <span className="italic text-primary">right people</span> around it.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Publish a research proposal, list the skills you need, and form a
                team from researchers whose expertise actually matches the work.
              </p>

              <HeroActions />
            </div>
          </div>
        </section>

        {/* How it works - a real sequence, so the numbering is meaningful */}
        <section className="container py-20">
          <h2 className="font-display text-3xl font-medium tracking-tight">
            How it works
          </h2>

          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="border-t-2 border-primary/25 pt-5">
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm text-muted-foreground">
                    0{i + 1}
                  </span>
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-xl font-medium">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  );
}
