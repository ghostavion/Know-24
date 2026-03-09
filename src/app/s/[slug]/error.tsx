"use client";

interface StorefrontErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StorefrontError({ error, reset }: StorefrontErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-7 w-7 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-xl font-semibold text-foreground">
          We&apos;re having trouble loading this page
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please try again in a moment.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
