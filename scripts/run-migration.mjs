#!/usr/bin/env node
/**
 * Runs the credit system migration against Supabase via the pg endpoint.
 * Usage: node scripts/run-migration.mjs
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

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Read migration SQL
const sql = readFileSync(
  resolve(root, "supabase/migrations/00013_credit_system.sql"),
  "utf-8"
);

// Split into individual statements (the migration has multiple CREATE TABLE etc.)
// We'll try sending the whole thing first via the pg-meta endpoint
async function runMigration() {
  console.log("Running migration 00013_credit_system.sql...\n");

  // Try the Supabase SQL execution endpoint (pg-meta)
  const pgMetaUrl = supabaseUrl.replace(".supabase.co", ".supabase.co");

  // Method 1: Use the /rest/v1/rpc endpoint to check if tables already exist
  const checkRes = await fetch(`${supabaseUrl}/rest/v1/credits?select=id&limit=1`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (checkRes.ok) {
    console.log("Migration tables already exist (credits table found).");
    console.log("If you need to re-run, drop the tables first from Supabase SQL Editor.");
    return;
  }

  // Tables don't exist — need to run migration
  // The REST API can't execute DDL, so we need to guide the user
  console.log("Tables not yet created. The Supabase REST API cannot run DDL statements.");
  console.log("\nPlease run the migration manually:");
  console.log("1. Go to your Supabase Dashboard: " + supabaseUrl.replace(".supabase.co", ".supabase.co"));
  console.log("2. Navigate to SQL Editor");
  console.log("3. Paste the contents of: supabase/migrations/00013_credit_system.sql");
  console.log("4. Click Run\n");
  console.log("The migration file is " + sql.split("\n").length + " lines long.");
  console.log("\nAlternatively, copy this to your clipboard and paste it:");
  console.log("---");
  // Print first 5 lines as preview
  const lines = sql.split("\n");
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    console.log(lines[i]);
  }
  console.log(`... (${lines.length - 5} more lines)`);
}

runMigration().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
