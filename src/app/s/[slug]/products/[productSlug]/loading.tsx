export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Back link skeleton */}
      <div className="h-4 w-28 animate-pulse rounded bg-muted" />

      {/* Cover image skeleton */}
      <div className="mt-6 aspect-[16/9] w-full animate-pulse rounded-xl bg-muted" />

      {/* Title skeleton */}
      <div className="mt-6 h-8 w-72 animate-pulse rounded bg-muted" />

      {/* Price skeleton */}
      <div className="mt-3 h-6 w-20 animate-pulse rounded bg-muted" />

      {/* Button skeleton */}
      <div className="mt-6 h-11 w-44 animate-pulse rounded-lg bg-muted" />

      {/* Description skeleton */}
      <div className="mt-8 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
