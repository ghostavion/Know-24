#!/usr/bin/env node
/**
 * Setup script: Creates Know24 subscription products and prices in Stripe.
 *
 * Usage:
 *   1. Set STRIPE_SECRET_KEY in your .env.local (or export it)
 *   2. Run: node scripts/setup-stripe-products.mjs
 *
 * This script is idempotent — it checks for existing products by lookup_key
 * before creating new ones.
 */

import Stripe from "stripe";
import { readFileSync } from "fs";
import { resolve } from "path";

// Try to load from .env.local
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local doesn't exist, rely on exported env vars
  }
}

loadEnv();

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Error: STRIPE_SECRET_KEY not set.");
  console.error("Set it in .env.local or export it before running this script.");
  process.exit(1);
}

const stripe = new Stripe(key);

const PRODUCTS = [
  {
    name: "Know24 Founder",
    description:
      "Lock in the lowest price forever. 200 AI credits/month, full ebook pipeline, cover art, scout scanning, priority support.",
    lookupKey: "know24_founder_monthly",
    priceCents: 7900,
  },
  {
    name: "Know24 Standard",
    description:
      "Everything you need to research, create, and sell ebooks with AI. 200 AI credits/month.",
    lookupKey: "know24_standard_monthly",
    priceCents: 9900,
  },
];

async function main() {
  console.log("Setting up Stripe products for Know24...\n");

  for (const product of PRODUCTS) {
    // Check if price with this lookup_key already exists
    const existingPrices = await stripe.prices.list({
      lookup_keys: [product.lookupKey],
      limit: 1,
    });

    if (existingPrices.data.length > 0) {
      const existing = existingPrices.data[0];
      console.log(
        `✓ ${product.name} already exists (price: ${existing.id}, product: ${existing.product})`
      );
      continue;
    }

    // Create product
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: { platform: "know24" },
    });

    // Create price with lookup_key
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.priceCents,
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: product.lookupKey,
    });

    console.log(
      `✓ Created ${product.name}: product=${stripeProduct.id}, price=${stripePrice.id}`
    );
  }

  console.log("\nDone! Add these to your .env.local if needed:");
  console.log("  STRIPE_PRICE_FOUNDER_MONTHLY=<price_id from above>");
  console.log("  STRIPE_PRICE_STANDARD_MONTHLY=<price_id from above>");
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
