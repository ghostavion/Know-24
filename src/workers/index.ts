import { Worker } from "bullmq";
import type { ConnectionOptions, Job } from "bullmq";

import { generateProduct } from "./processors/generate-product";
import { ingestEmbeddings } from "./processors/ingest-embeddings";
import { processKnowledge } from "./processors/process-knowledge";
import { publishBlog } from "./processors/publish-blog";
import { runScoutScan } from "./processors/run-scout-scan";
import { sendEmail } from "./processors/send-email";

import type { GenerateProductJobData } from "./processors/generate-product";
import type { IngestEmbeddingsJobData } from "./processors/ingest-embeddings";
import type { ProcessKnowledgeJobData } from "./processors/process-knowledge";
import type { PublishBlogJobData } from "./processors/publish-blog";
import type { RunScoutScanJobData } from "./processors/run-scout-scan";
import type { SendEmailJobData } from "./processors/send-email";

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

function getConnection(): ConnectionOptions {
  const url = process.env.UPSTASH_REDIS_URL;
  if (!url) {
    throw new Error("UPSTASH_REDIS_URL is not set");
  }
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

const connection = getConnection();

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function logStart(queueName: string, jobId: string | undefined): void {
  console.log(`[worker:${queueName}] job=${jobId ?? "unknown"} started`);
}

function logCompleted(queueName: string, jobId: string | undefined): void {
  console.log(`[worker:${queueName}] job=${jobId ?? "unknown"} completed`);
}

function logFailed(queueName: string, jobId: string | undefined, error: Error): void {
  console.error(
    `[worker:${queueName}] job=${jobId ?? "unknown"} failed:`,
    error.message
  );
}

// ---------------------------------------------------------------------------
// Worker factory
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- BullMQ generic constraint requires this
function createWorkerWithEvents<T = any>(
  queueName: string,
  processor: (job: Job<T>) => Promise<void>
): Worker<T> {
  const worker = new Worker<T>(queueName, processor, {
    connection,
    concurrency: 3,
  });

  worker.on("active", (job: Job<T>) => {
    logStart(queueName, job.id);
  });

  worker.on("completed", (job: Job<T>) => {
    logCompleted(queueName, job.id);
  });

  worker.on("failed", (job: Job<T> | undefined, error: Error) => {
    logFailed(queueName, job?.id, error);
  });

  worker.on("error", (error: Error) => {
    console.error(`[worker:${queueName}] error:`, error.message);
  });

  return worker;
}

// ---------------------------------------------------------------------------
// Workers
// ---------------------------------------------------------------------------

const workers: Worker[] = [];

workers.push(
  createWorkerWithEvents<ProcessKnowledgeJobData>(
    "knowledge-ingest",
    processKnowledge
  )
);

workers.push(
  createWorkerWithEvents<GenerateProductJobData>(
    "product-generation",
    generateProduct
  )
);

workers.push(
  createWorkerWithEvents<PublishBlogJobData>(
    "blog-publish",
    publishBlog
  )
);

workers.push(
  createWorkerWithEvents<SendEmailJobData>(
    "email-send",
    sendEmail
  )
);

workers.push(
  createWorkerWithEvents<RunScoutScanJobData>(
    "scout-scan",
    runScoutScan
  )
);

workers.push(
  createWorkerWithEvents<IngestEmbeddingsJobData>(
    "embedding-ingest",
    ingestEmbeddings
  )
);

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

console.log(
  `[workers] Started ${workers.length} workers: ${workers.map((w) => w.name).join(", ")}`
);

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async function shutdown(signal: string): Promise<void> {
  console.log(`[workers] Received ${signal}, shutting down gracefully...`);

  await Promise.all(workers.map((w) => w.close()));

  console.log("[workers] All workers closed");
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
