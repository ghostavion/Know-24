import { Queue, type ConnectionOptions } from "bullmq";

function getConnection(): ConnectionOptions {
  const url = process.env.UPSTASH_REDIS_URL;
  if (!url) {
    throw new Error("UPSTASH_REDIS_URL is not set");
  }
  // Parse rediss:// URL for BullMQ
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6380"),
    password: parsed.password,
    tls: parsed.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

let _connection: ConnectionOptions | null = null;

function connection(): ConnectionOptions {
  if (!_connection) {
    _connection = getConnection();
  }
  return _connection;
}

// Lazy queue factory — avoids connecting at module load (build time)
const queueCache = new Map<string, Queue>();

function getQueue(name: string): Queue {
  let q = queueCache.get(name);
  if (!q) {
    q = new Queue(name, { connection: connection() });
    queueCache.set(name, q);
  }
  return q;
}

export function getProductGenerationQueue(): Queue {
  return getQueue("product-generation");
}
export function getKnowledgeIngestQueue(): Queue {
  return getQueue("knowledge-ingest");
}
export function getBlogPublishQueue(): Queue {
  return getQueue("blog-publish");
}
export function getEmailSendQueue(): Queue {
  return getQueue("email-send");
}
export function getScoutScanQueue(): Queue {
  return getQueue("scout-scan");
}
export function getSocialPostQueue(): Queue {
  return getQueue("social-post-generate");
}
export function getEmbeddingIngestQueue(): Queue {
  return getQueue("embedding-ingest");
}
