import { Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Plus className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No businesses yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Get started by creating your first knowledge business. Our AI will
          help you build products, a storefront, and marketing in under an hour.
        </p>
        <Link
          href="/setup"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Setup My Business
        </Link>
      </div>
    </div>
  );
}
