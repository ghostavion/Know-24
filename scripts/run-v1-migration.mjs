#!/usr/bin/env node
/**
 * Runs the V1 migration against Supabase using the Management API (pg-meta).
 * This uses the Supabase project ref + service role key to execute raw SQL.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const content = readFileSync(resolve(root, ".env.local"), "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL (e.g., https://zvpzwobncaakieadmvkr.supabase.co → zvpzwobncaakieadmvkr)
const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

// Build the full migration SQL with the prerequisite function
const migrationSql = readFileSync(
  resolve(root, "supabase/migrations/00013_credit_system.sql"),
  "utf-8"
);

const fullSql = `
-- Prerequisite: updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

${migrationSql}
`;

async function runMigration() {
  console.log("Running V1 migration against Supabase...");
  console.log("Project ref:", projectRef);
  console.log("SQL length:", fullSql.length, "chars\n");

  // Use the Supabase pg-meta SQL endpoint
  // POST https://<project-ref>.supabase.co/pg/query
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({}),
  });

  // The REST API doesn't support raw SQL execution
  // Let's try the database connection string approach instead
  console.log("REST API cannot execute DDL. Trying direct PostgreSQL connection...\n");

  // Check if DATABASE_URL is set
  const dbUrl = env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("[PASSWORD]")) {
    console.log("No DATABASE_URL configured. Let me try another approach...\n");

    // Copy SQL to clipboard
    try {
      const { execSync } = await import("child_process");
      execSync("echo " + JSON.stringify(fullSql).slice(0, 8000) + " | clip", {
        stdio: "pipe",
      });
    } catch {
      // clipboard may not work
    }

    console.log("=== MANUAL STEP REQUIRED ===");
    console.log("Go to: https://supabase.com/dashboard/project/" + projectRef + "/sql");
    console.log("Paste the SQL below and click Run:\n");
    console.log("--- BEGIN SQL ---");
    console.log(fullSql);
    console.log("--- END SQL ---");
    return;
  }

  // If we have a database URL, use pg to connect directly
  try {
    const pg = await import("pg");
    const client = new pg.default.Client({ connectionString: dbUrl });
    await client.connect();
    console.log("Connected to database. Running migration...");
    await client.query(fullSql);
    console.log("Migration completed successfully!");
    await client.end();
  } catch (err) {
    console.error("Database connection failed:", err.message);
    console.log("\nFallback: paste the migration SQL into Supabase SQL Editor manually.");
  }
}

runMigration().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
