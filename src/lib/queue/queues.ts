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

export const productGenerationQueue = new Queue("product-generation", {
  connection: connection(),
});
export const knowledgeIngestQueue = new Queue("knowledge-ingest", {
  connection: connection(),
});
export const blogPublishQueue = new Queue("blog-publish", {
  connection: connection(),
});
export const emailSendQueue = new Queue("email-send", {
  connection: connection(),
});
export const scoutScanQueue = new Queue("scout-scan", {
  connection: connection(),
});
export const socialPostQueue = new Queue("social-post-generate", {
  connection: connection(),
});
export const embeddingIngestQueue = new Queue("embedding-ingest", {
  connection: connection(),
});
