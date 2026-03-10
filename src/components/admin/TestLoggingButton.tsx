"use client";

import { useState } from "react";
import { Loader2, FlaskConical, CheckCircle2, XCircle } from "lucide-react";

interface TestResult {
  platform_logs_insert: string | { error: string; code: string; details: string };
  activity_log_insert: string | { error: string; code: string; details: string };
  platform_logs_total_rows: number;
  activity_log_total_rows: number;
}

const TestLoggingButton = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState("");

  const runTest = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/test-log");
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? `HTTP ${res.status}`);
        return;
      }

      setResult(json.data);
    } catch {
      setError("Network error — could not reach the API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-violet-500" />
          Logging Diagnostic
        </h3>
        <button
          onClick={runTest}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing…
            </>
          ) : (
            "Test Logging"
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-200">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <ResultRow
            label="platform_logs insert"
            value={result.platform_logs_insert}
          />
          <ResultRow
            label="activity_log insert"
            value={result.activity_log_insert}
          />
          <div className="flex gap-6 pt-2 text-sm text-muted-foreground">
            <span>Platform logs total: <strong className="text-foreground">{result.platform_logs_total_rows}</strong></span>
            <span>Activity logs total: <strong className="text-foreground">{result.activity_log_total_rows}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

function ResultRow({ label, value }: { label: string; value: string | { error: string; code: string; details: string } }) {
  const ok = value === "OK";
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
      )}
      <span className="font-medium">{label}:</span>
      {ok ? (
        <span className="text-green-600 dark:text-green-400">OK</span>
      ) : (
        <span className="text-red-600 dark:text-red-400">
          {typeof value === "object" ? `${value.error} (${value.code})` : value}
        </span>
      )}
    </div>
  );
}

export default TestLoggingButton;
