export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="animate-pulse bg-muted">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="h-10 w-64 rounded bg-muted-foreground/10" />
          <div className="mt-4 h-6 w-96 max-w-full rounded bg-muted-foreground/10" />
          <div className="mt-8 h-10 w-36 rounded bg-muted-foreground/10" />
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="h-7 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border p-4">
              <div className="aspect-[4/3] rounded-lg bg-muted" />
              <div className="mt-3 h-5 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-4 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* About skeleton */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="h-7 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
