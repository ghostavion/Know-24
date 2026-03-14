import { Server, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminHealthPanel } from "@/components/admin/AdminHealthPanel";

interface EnvCheck {
  name: string;
  service: string;
  configured: boolean;
}

function getEnvChecks(): EnvCheck[] {
  return [
    {
      name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      service: "Clerk (Auth)",
      configured: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    },
    {
      name: "CLERK_SECRET_KEY",
      service: "Clerk (Auth)",
      configured: !!process.env.CLERK_SECRET_KEY,
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      service: "Supabase (Database)",
      configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      service: "Supabase (Database)",
      configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    {
      name: "STRIPE_SECRET_KEY",
      service: "Stripe (Payments)",
      configured: !!process.env.STRIPE_SECRET_KEY,
    },
    {
      name: "STRIPE_WEBHOOK_SECRET",
      service: "Stripe (Webhooks)",
      configured: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    {
      name: "OPENAI_API_KEY",
      service: "OpenAI (AI)",
      configured: !!process.env.OPENAI_API_KEY,
    },
    {
      name: "UPSTASH_REDIS_REST_URL",
      service: "Upstash Redis",
      configured: !!process.env.UPSTASH_REDIS_REST_URL,
    },
    {
      name: "UPSTASH_REDIS_REST_TOKEN",
      service: "Upstash Redis",
      configured: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    {
      name: "RESEND_API_KEY",
      service: "Resend (Email)",
      configured: !!process.env.RESEND_API_KEY,
    },
    {
      name: "SENTRY_DSN",
      service: "Sentry (Monitoring)",
      configured: !!process.env.SENTRY_DSN,
    },
    {
      name: "CLOUDFLARE_R2_ACCESS_KEY_ID",
      service: "Cloudflare R2 (Storage)",
      configured: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    },
    {
      name: "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
      service: "Cloudflare R2 (Storage)",
      configured: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
    {
      name: "CLOUDFLARE_R2_BUCKET",
      service: "Cloudflare R2 (Storage)",
      configured: !!process.env.CLOUDFLARE_R2_BUCKET,
    },
  ];
}

export default function AdminServicesPage() {
  const envChecks = getEnvChecks();
  const configuredCount = envChecks.filter((e) => e.configured).length;
  const totalCount = envChecks.length;

  // Group by service
  const grouped = envChecks.reduce<Record<string, EnvCheck[]>>((acc, check) => {
    if (!acc[check.service]) {
      acc[check.service] = [];
    }
    acc[check.service].push(check);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Server className="h-5 w-5 text-[#7C3AED]" />
          <h2 className="text-2xl font-semibold text-foreground">
            Services & Configuration
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Live service health checks and environment configuration status.
        </p>
      </div>

      {/* Live Health Checks */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Live Service Health
        </h3>
        <AdminHealthPanel />
      </div>

      {/* Environment Configuration */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Environment Configuration
          </h3>
          <span className="text-sm text-muted-foreground">
            {configuredCount}/{totalCount} variables configured
          </span>
        </div>

        <div className="space-y-4">
          {Object.entries(grouped).map(([service, checks]) => {
            const allConfigured = checks.every((c) => c.configured);
            return (
              <div
                key={service}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  {allConfigured ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <h4 className="text-sm font-semibold text-foreground">
                    {service}
                  </h4>
                </div>
                <div className="space-y-2">
                  {checks.map((check) => (
                    <div
                      key={check.name}
                      className="flex items-center justify-between"
                    >
                      <code className="text-xs text-muted-foreground">
                        {check.name}
                      </code>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          check.configured
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {check.configured ? "Set" : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
