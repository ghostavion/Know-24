import { Job } from "bullmq";

import { runScan } from "@/lib/scout/orchestrator";

export interface RunScoutScanJobData {
  scanId: string;
  businessId: string;
}

/**
 * Execute a Scout scan for a business. Delegates to the Scout orchestrator
 * which handles platform scanning, relevance scoring, and draft responses.
 */
export async function runScoutScan(job: Job<RunScoutScanJobData>): Promise<void> {
  const { scanId, businessId } = job.data;

  const result = await runScan(scanId, businessId);

  if (result.errors.length > 0) {
    console.error(
      `[scout-scan] job=${job.id} scan=${scanId} opportunities=${result.opportunitiesFound} errors:`,
      result.errors
    );
  }

  // If the scan itself recorded errors but didn't throw, we still consider
  // the job successful. The scan status is tracked in the database.
}
