#!/usr/bin/env node
/**
 * Know24 V1 Launch Setup
 *
 * Run this once to set up everything needed for V1:
 *   1. Creates .env.local from .env.example (if it doesn't exist)
 *   2. Creates Stripe products/prices
 *   3. Prints remaining manual steps
 *
 * Usage: node scripts/setup-v1.mjs
 */

import { existsSync, readFileSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

console.log("=== Know24 V1 Launch Setup ===\n");

// Step 1: Check .env.local
const envLocalPath = resolve(root, ".env.local");
const envExamplePath = resolve(root, ".env.example");

if (!existsSync(envLocalPath)) {
  if (existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envLocalPath);
    console.log("✓ Created .env.local from .env.example");
    console.log("  → Fill in your real API keys before continuing\n");
  } else {
    console.log("✗ No .env.example found. Create .env.local manually.\n");
  }
} else {
  console.log("✓ .env.local already exists\n");
}

// Step 2: Check key env vars
const envContent = existsSync(envLocalPath)
  ? readFileSync(envLocalPath, "utf-8")
  : "";

const requiredVars = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "ANTHROPIC_API_KEY",
  "FIRECRAWL_API_KEY",
  "TAVILY_API_KEY",
  "RESEND_API_KEY",
  "INTERNAL_API_SECRET",
];

console.log("Environment variable check:");
const missing = [];
for (const v of requiredVars) {
  const regex = new RegExp(`^${v}=(.+)$`, "m");
  const match = envContent.match(regex);
  const value = match?.[1]?.trim() ?? "";
  const isPlaceholder =
    !value || value.includes("...") || value.includes("your-key");
  if (isPlaceholder) {
    console.log(`  ✗ ${v} — not set`);
    missing.push(v);
  } else {
    console.log(`  ✓ ${v}`);
  }
}

if (missing.length > 0) {
  console.log(`\n⚠ ${missing.length} env vars need real values in .env.local`);
} else {
  console.log("\n✓ All required env vars are set");
}

// Step 3: Stripe products
console.log("\n--- Stripe Products ---");
if (missing.includes("STRIPE_SECRET_KEY")) {
  console.log(
    "  ⚠ Set STRIPE_SECRET_KEY first, then run: node scripts/setup-stripe-products.mjs"
  );
} else {
  console.log("  Run: node scripts/setup-stripe-products.mjs");
}

// Step 4: Print remaining manual steps
console.log("\n--- Remaining Manual Steps ---");
console.log("1. Run Supabase migration:");
console.log(
  "   → Paste contents of supabase/migrations/00013_credit_system.sql into"
);
console.log("     your Supabase Dashboard > SQL Editor and run it");
console.log("");
console.log("2. Create Stripe webhook:");
console.log("   → Stripe Dashboard > Webhooks > Add endpoint");
console.log("   → URL: https://your-domain.com/api/stripe/webhook");
console.log("   → Events: checkout.session.completed, customer.subscription.created,");
console.log(
  "     customer.subscription.updated, customer.subscription.deleted"
);
console.log("");
console.log("3. Update Clerk redirect:");
console.log("   → Set NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/welcome in .env.local");
console.log("");
console.log("4. Start dev server:");
console.log("   → npm run dev (starts Next.js)");
console.log("   → npm run inngest:dev (starts Inngest dev server in another terminal)");
console.log("");
console.log("5. Create Supabase Storage bucket:");
console.log('   → Create a bucket called "ebooks" in Supabase Dashboard > Storage');
console.log("");
console.log("=== Setup complete! ===");
