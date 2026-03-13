import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

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
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const prices = await stripe.prices.list({ active: true, limit: 20 });
for (const p of prices.data) {
  console.log(p.id, "|", p.lookup_key, "|", "$" + (p.unit_amount / 100), "|", p.recurring?.interval, "|", p.product);
}
