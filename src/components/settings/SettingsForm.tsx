"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Save, Trash2, Loader2, Crown, CreditCard, ExternalLink, Key } from "lucide-react";

interface SettingsFormProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    emailAddress: string;
    imageUrl: string;
  };
}

interface NotificationPreferences {
  agentUpdates: boolean;
  weeklyDigest: boolean;
  productNews: boolean;
}

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export const SettingsForm = ({ user }: SettingsFormProps) => {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [timezone, setTimezone] = useState("America/New_York");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    agentUpdates: true,
    weeklyDigest: true,
    productNews: false,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = useCallback(
    (key: keyof NotificationPreferences) => {
      setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          timezone,
          notifications,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setSaveMessage("Settings saved successfully.");
    } catch {
      setSaveMessage("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);

    try {
      const response = await fetch("/api/settings", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      window.location.href = "/";
    } catch {
      setSaveMessage("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Account Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal information and preferences.
        </p>

        <div className="mt-6 space-y-5">
          {/* Avatar display */}
          <div className="flex items-center gap-4">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                {(firstName?.[0] ?? "U").toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {user.emailAddress}
              </p>
              <p className="text-xs text-muted-foreground">
                Profile photo is managed through your auth provider.
              </p>
            </div>
          </div>

          {/* First and Last Name */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-foreground"
              >
                First name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className={cn(
                  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                )}
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-foreground"
              >
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={cn(
                  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                )}
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-foreground"
            >
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={cn(
                "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2",
                "text-sm text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              )}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <SubscriptionSection />

      {/* API Keys Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">API Keys</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring your own API keys for supported providers. This allows you to use
          your own quotas and billing.
        </p>

        <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <Key className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Coming soon
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            BYOK (Bring Your Own Key) support for OpenAI, Anthropic, and other
            providers will be available in a future update.
          </p>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">
          Notifications
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which email notifications you receive.
        </p>

        <div className="mt-6 space-y-4">
          <NotificationToggle
            label="Agent updates"
            description="Get notified when your agents complete tasks or need attention."
            checked={notifications.agentUpdates}
            onToggle={() => handleToggle("agentUpdates")}
          />
          <NotificationToggle
            label="Weekly digest"
            description="Weekly summary of your agent activity and usage."
            checked={notifications.weeklyDigest}
            onToggle={() => handleToggle("weeklyDigest")}
          />
          <NotificationToggle
            label="Product news"
            description="Updates about new features, improvements, and tips."
            checked={notifications.productNews}
            onToggle={() => handleToggle("productNews")}
          />
        </div>
      </div>

      {/* Save Button and Message */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2",
            "text-sm font-medium text-primary-foreground",
            "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors"
          )}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        {saveMessage && (
          <p
            className={cn(
              "text-sm",
              saveMessage.includes("success")
                ? "text-green-600"
                : "text-destructive"
            )}
          >
            {saveMessage}
          </p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-card p-6">
        <h2 className="text-base font-semibold text-destructive">
          Danger Zone
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className={cn(
              "mt-4 inline-flex items-center gap-2 rounded-lg border border-destructive px-4 py-2",
              "text-sm font-medium text-destructive",
              "hover:bg-destructive hover:text-destructive-foreground",
              "focus:outline-none focus:ring-2 focus:ring-destructive/30",
              "transition-colors"
            )}
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-foreground">
              Type <span className="font-semibold">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className={cn(
                "w-full max-w-xs rounded-lg border border-destructive/50 bg-background px-3 py-2",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive"
              )}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2",
                  "text-sm font-medium text-destructive-foreground",
                  "hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive/30",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "transition-colors"
                )}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? "Deleting..." : "Permanently delete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className={cn(
                  "rounded-lg border border-border px-4 py-2",
                  "text-sm font-medium text-foreground",
                  "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30",
                  "transition-colors"
                )}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

/* ---------------------------------------------------------- */
/* Notification Toggle Sub-component                          */
/* ---------------------------------------------------------- */

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}

/* ---------------------------------------------------------- */
/* Subscription Section                                       */
/* ---------------------------------------------------------- */

interface SubStatus {
  active: boolean;
  tier: "free" | "paid" | null;
  status: string;
}

const SubscriptionSection = () => {
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setSub(json.data);
      })
      .catch(() => {});
  }, []);

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/billing-portal", { method: "POST" });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      }
    } finally {
      setPortalLoading(false);
    }
  };

  if (!sub) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading subscription...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Subscription</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your AgentTV subscription and billing.
      </p>

      <div className="mt-6 space-y-4">
        {/* Current plan */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            {sub.tier === "paid" && <Crown className="h-5 w-5 text-primary" />}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {sub.tier === "paid" ? "Pro Plan — $99/mo" : "Free Plan"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                Status: {sub.status}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              sub.active
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            {sub.active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Manage billing */}
        {sub.active ? (
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={portalLoading}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2",
              "text-sm font-medium text-foreground",
              "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors"
            )}
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Manage Billing
          </button>
        ) : (
          <a
            href="/pricing"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2",
              "text-sm font-medium text-primary-foreground",
              "hover:bg-primary/90 transition-colors"
            )}
          >
            Upgrade to Pro — $99/mo
          </a>
        )}
      </div>
    </div>
  );
};

const NotificationToggle = ({
  label,
  description,
  checked,
  onToggle,
}: NotificationToggleProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
};
