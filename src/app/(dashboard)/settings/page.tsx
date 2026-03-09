import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          Settings will be available once your first business is created.
        </div>
      </div>
    </div>
  );
}
