export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Back link skeleton */}
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />

      {/* Title skeleton */}
      <div className="mt-6 h-8 w-48 animate-pulse rounded bg-muted" />

      {/* Blog card grid skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border p-4">
            <div className="aspect-[16/9] rounded-lg bg-muted" />
            <div className="mt-4 space-y-2">
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
            <div className="mt-3 h-3 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
