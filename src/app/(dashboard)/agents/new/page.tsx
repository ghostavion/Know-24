"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Key,
  Target,
  Wallet,
  Sparkles,
  Zap,
  Code,
  Cpu,
  Workflow,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const createAgentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/, "Lowercase alphanumeric and hyphens only"),
  description: z.string().max(2000).optional(),
  framework: z.enum(["langgraph", "crewai", "openai-agents", "raw-python", "nodejs"]),
  byok_provider: z.enum(["openai", "anthropic", "google", "openai-compatible"]).optional(),
  byok_key: z.string().optional(),
  goal: z.string().min(1, "Agent goal is required").max(5000),
  budget_usd: z.coerce.number().min(0).max(100000),
  daily_cap_usd: z.coerce.number().min(0).max(10000),
});

type FormData = z.infer<typeof createAgentSchema>;

// ---------------------------------------------------------------------------
// Framework options
// ---------------------------------------------------------------------------
const FRAMEWORKS = [
  {
    value: "langgraph" as const,
    label: "LangGraph",
    description: "Graph-based agent orchestration",
    icon: Workflow,
    color: "border-blue-500 bg-blue-500/10",
  },
  {
    value: "crewai" as const,
    label: "CrewAI",
    description: "Multi-agent collaboration",
    icon: Users,
    color: "border-purple-500 bg-purple-500/10",
  },
  {
    value: "openai-agents" as const,
    label: "OpenAI Agents",
    description: "OpenAI Agents SDK",
    icon: Sparkles,
    color: "border-green-500 bg-green-500/10",
  },
  {
    value: "raw-python" as const,
    label: "Raw Python",
    description: "Custom Python script",
    icon: Code,
    color: "border-yellow-500 bg-yellow-500/10",
  },
  {
    value: "nodejs" as const,
    label: "Node.js",
    description: "JavaScript/TypeScript agent",
    icon: Cpu,
    color: "border-teal-500 bg-teal-500/10",
  },
];

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "openai-compatible", label: "OpenAI-Compatible (Groq, Together, etc.)" },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CreateAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<"success" | "error" | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(createAgentSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      framework: "langgraph",
      byok_provider: "openai",
      byok_key: "",
      goal: "",
      budget_usd: 50,
      daily_cap_usd: 10,
    },
  });

  const selectedFramework = watch("framework");
  const name = watch("name");

  // Auto-generate slug from name
  function handleNameChange(value: string) {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64);
    if (slug.length >= 3) {
      setValue("slug", slug);
    }
  }

  async function testApiKey() {
    const provider = watch("byok_provider");
    const key = watch("byok_key");
    if (!key) return;

    setTestingKey(true);
    setKeyTestResult(null);

    try {
      const res = await fetch("/api/agents/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key }),
      });

      if (!res.ok) {
        setKeyTestResult("error");
        return;
      }

      const data = await res.json();
      setKeyTestResult(data.valid ? "success" : "error");
    } catch {
      setKeyTestResult("error");
    } finally {
      setTestingKey(false);
    }
  }

  const STEP_FIELDS: (keyof FormData)[][] = [
    ["name", "slug", "description"],
    ["framework"],
    ["byok_provider", "byok_key"],
    ["goal"],
    ["budget_usd", "daily_cap_usd"],
  ];

  async function nextStep() {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          description: data.description,
          framework: data.framework,
          byok_provider: data.byok_provider,
          config: {
            goal: data.goal,
            budget_usd: data.budget_usd,
            daily_cap_usd: data.daily_cap_usd,
          },
        }),
      });

      if (res.ok) {
        router.push("/agents");
      } else {
        const json = await res.json();
        console.error("[create-agent] Error:", json.error);
        toast.error(json.error?.message ?? "Failed to create agent");
      }
    } catch (err) {
      console.error("[create-agent] Error:", err);
      toast.error("Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  }

  const STEP_TITLES = [
    { title: "Name & Identity", icon: Bot },
    { title: "Framework", icon: Cpu },
    { title: "API Key (BYOK)", icon: Key },
    { title: "Agent Goal", icon: Target },
    { title: "Budget", icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/agents")}>
          <ChevronLeft className="size-4" />
          Back to Agents
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create Agent</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEP_TITLES.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="size-3" /> : <s.icon className="size-3" />}
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < 4 && <div className="h-px w-4 bg-border" />}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          {/* Step 1: Name + Slug */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Agent Name</label>
                <input
                  {...register("name", {
                    onChange: (e) => handleNameChange(e.target.value),
                  })}
                  placeholder="My Trading Bot"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">agenttv.com/watch/</span>
                  <input
                    {...register("slug")}
                    placeholder="my-trading-bot"
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {errors.slug && (
                  <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="What does your agent do?"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Framework */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose the framework your agent is built with.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FRAMEWORKS.map((fw) => (
                  <button
                    key={fw.value}
                    type="button"
                    onClick={() => setValue("framework", fw.value)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                      selectedFramework === fw.value
                        ? fw.color + " border-opacity-100"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <fw.icon className="size-8 shrink-0" />
                    <div>
                      <p className="font-semibold">{fw.label}</p>
                      <p className="text-xs text-muted-foreground">{fw.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: BYOK Key */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Bring your own API key. We never store your key — it is encrypted and used only
                during agent execution.
              </p>
              <div>
                <label className="text-sm font-medium">Provider</label>
                <select
                  {...register("byok_provider")}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">API Key</label>
                <div className="mt-1 flex gap-2">
                  <input
                    {...register("byok_key")}
                    type="password"
                    placeholder="sk-..."
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={testApiKey}
                    disabled={testingKey}
                  >
                    {testingKey ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : keyTestResult === "success" ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Zap className="size-4" />
                    )}
                    Test Key
                  </Button>
                </div>
                {keyTestResult === "error" && (
                  <p className="mt-1 text-xs text-red-500">
                    Key validation failed. Check your key and provider selection.
                  </p>
                )}
                {keyTestResult === "success" && (
                  <p className="mt-1 text-xs text-green-600">Key is valid.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Goal */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                What should your agent do to make money? Be specific about its strategy.
              </p>
              <div>
                <label className="text-sm font-medium">Agent Goal / System Prompt</label>
                <textarea
                  {...register("goal")}
                  rows={8}
                  placeholder="You are a trading agent that monitors crypto markets and executes arbitrage opportunities..."
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                {errors.goal && (
                  <p className="mt-1 text-xs text-red-500">{errors.goal.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Budget */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set a starting budget and daily spending cap. You can adjust these at any time.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Starting Budget (USD)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <input
                      {...register("budget_usd")}
                      type="number"
                      step="1"
                      min="0"
                      className="w-full rounded-lg border bg-background py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {errors.budget_usd && (
                    <p className="mt-1 text-xs text-red-500">{errors.budget_usd.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Daily Cap (USD)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <input
                      {...register("daily_cap_usd")}
                      type="number"
                      step="1"
                      min="0"
                      className="w-full rounded-lg border bg-background py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {errors.daily_cap_usd && (
                    <p className="mt-1 text-xs text-red-500">{errors.daily_cap_usd.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>

          {step < 4 ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Zap className="size-4" />
                  Deploy Agent
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
