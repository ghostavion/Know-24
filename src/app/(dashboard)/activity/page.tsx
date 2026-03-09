import { Sparkles } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">AI Advisor</h1>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No recommendations yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Once you set up a business, your AI Advisor will proactively surface
          insights, drafts, and opportunities here.
        </p>
      </div>
    </div>
  );
}
