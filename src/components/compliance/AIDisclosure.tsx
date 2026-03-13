import { cn } from "@/lib/utils";

interface AIDisclosureProps {
  /** Optional custom label text. Defaults to "AI-generated content" */
  label?: string;
  /** Visual variant: "inline" for within content, "badge" for a small tag */
  variant?: "inline" | "badge";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays an "AI-generated content" disclosure label for GDPR/transparency
 * compliance. Use on any AI-generated text visible to end users, such as
 * storefront blog posts and product descriptions.
 */
export function AIDisclosure({
  label = "AI-generated content",
  variant = "inline",
  className,
}: AIDisclosureProps) {
  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-500/30",
          className
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2v4" />
          <path d="m6.8 15-3.5 2" />
          <path d="m20.7 17-3.5-2" />
          <path d="M6.8 9 3.3 7" />
          <path d="m20.7 7-3.5 2" />
          <path d="m9 22 3-8 3 8" />
          <path d="M8 6a6 6 0 0 1 12 0" />
        </svg>
        {label}
      </span>
    );
  }

  // inline variant — a subtle text-level disclosure
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      {label}
    </p>
  );
}
