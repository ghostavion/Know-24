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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function createBucket(name, isPublic = false) {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: name,
      name: name,
      public: isPublic,
      file_size_limit: 52428800, // 50MB
      allowed_mime_types: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
    }),
  });

  const data = await res.json();
  if (res.ok) {
    console.log(`  ✓ Created bucket: ${name}`);
  } else if (data.message?.includes("already exists")) {
    console.log(`  ✓ Bucket already exists: ${name}`);
  } else {
    console.log(`  ✗ Failed to create ${name}:`, data.message || data);
  }
}

console.log("Creating Supabase Storage buckets...");
await createBucket("ebooks", false);
await createBucket("covers", true);
console.log("Done!");
