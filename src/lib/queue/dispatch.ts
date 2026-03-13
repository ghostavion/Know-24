/**
 * Dispatch module — replaces BullMQ queue.add() calls with Inngest event sends.
 * All background work is now triggered by sending events to Inngest.
 */

import { inngest } from "@/lib/inngest/client";

export async function dispatchResearchNiche(data: {
  businessId: string;
  niche: string;
  subNiches: string[];
  personalContext?: string;
}): Promise<void> {
  await inngest.send({ name: "research/niche.requested", data });
}

export async function dispatchProductGeneration(data: {
  productId: string;
  businessId: string;
  productTypeSlug: string;
}): Promise<void> {
  await inngest.send({ name: "product/generation.requested", data });
}

export async function dispatchPdfGeneration(data: {
  productId: string;
  businessId: string;
  title: string;
  content: string;
  chapters: { title: string; content: string }[];
}): Promise<void> {
  await inngest.send({ name: "product/pdf.requested", data });
}

export async function dispatchCoverGeneration(data: {
  productId: string;
  businessId: string;
  title: string;
  niche: string;
  style?: string;
}): Promise<void> {
  await inngest.send({ name: "product/cover.requested", data });
}

export async function dispatchEbookGeneration(data: {
  ebookId: string;
  userId: string;
  niche: string;
  personalAngle?: string | null;
  researchRunId?: string | null;
}): Promise<void> {
  await inngest.send({ name: "ebook/generation.requested", data });
}

export async function dispatchStorefrontBuild(data: {
  businessId: string;
  productId: string;
  themeId?: string;
}): Promise<void> {
  await inngest.send({ name: "storefront/build.requested", data });
}

export async function dispatchScoutScan(data: {
  scanId: string;
  businessId: string;
}): Promise<void> {
  await inngest.send({ name: "scout/scan.requested", data });
}

export async function dispatchEmail(data: {
  businessId: string;
  sequenceType: string;
  recipientEmail: string;
  variables?: Record<string, string>;
}): Promise<void> {
  await inngest.send({ name: "email/send.requested", data });
}

export async function dispatchEmailSequence(data: {
  businessId: string;
  sequenceId: string;
  subscriberEmail: string;
  subscriberName?: string;
  stepId?: string;
}): Promise<void> {
  await inngest.send({ name: "email/sequence.requested", data });
}
