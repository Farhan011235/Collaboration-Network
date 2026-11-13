import { cn } from "@/lib/utils";

// Small inline message under a form field.
export function FieldError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p className={cn("text-xs text-destructive", className)} role="alert">
      {message}
    </p>
  );
}
