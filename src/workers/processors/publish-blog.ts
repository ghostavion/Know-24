import { Job } from "bullmq";

import { runBlogPublisher } from "@/lib/cron/blog-publisher";

export interface PublishBlogJobData {
  businessId?: string;
}

/**
 * Publish AI-generated blog posts. When businessId is provided, only
 * that business is processed; otherwise all active businesses are handled.
 */
export async function publishBlog(job: Job<PublishBlogJobData>): Promise<void> {
  const { businessId } = job.data;

  const result = await runBlogPublisher();

  if (result.errors.length > 0) {
    console.error(
      `[publish-blog] job=${job.id} published=${result.published} errors:`,
      result.errors
    );
  }

  // If specific business was requested but nothing published, log a warning
  if (businessId && result.published === 0 && result.errors.length === 0) {
    console.warn(
      `[publish-blog] job=${job.id} No posts published for business ${businessId} (may already have recent post)`
    );
  }
}
