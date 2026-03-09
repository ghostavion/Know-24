export default function MarketingLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav skeleton */}
      <div className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          <div className="flex gap-4">
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto h-12 w-96 max-w-full animate-pulse rounded bg-muted" />
        <div className="mx-auto mt-4 h-6 w-80 max-w-full animate-pulse rounded bg-muted" />
        <div className="mx-auto mt-8 h-10 w-40 animate-pulse rounded bg-muted" />
      </div>

      {/* Content blocks skeleton */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 rounded-xl border p-6">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-5/6 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
