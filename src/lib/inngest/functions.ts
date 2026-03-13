import { inngest } from "./client";
import { createServiceClient } from "@/lib/supabase/server";
import { runNicheResearch, hashNiche } from "@/lib/research/orchestrator";
import { deductCredits } from "@/lib/credits/service";
import { runGenerator } from "@/lib/ai/generators";
import { runEbookPipeline } from "@/lib/ai/generators/ebook-pipeline";
import { generateProductPdf } from "@/lib/pdf/generator";
import { generateProductCover, generateOgImage } from "@/lib/images/cover-generator";
import { runScan } from "@/lib/scout/orchestrator";
import { triggerSequence } from "@/lib/email/sequences";
import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Research
// ---------------------------------------------------------------------------

export const researchNiche = inngest.createFunction(
  { id: "research-niche", concurrency: { limit: 5 } },
  { event: "research/niche.requested" },
  async ({ event, step }) => {
    const { runId, userId, niche, subNiches, personalAngle, businessId } = event.data;

    // Deduct credits
    const creditResult = await step.run("deduct-credits", async () => {
      return deductCredits(userId, "research_report", runId);
    });

    if (!creditResult.success) {
      const supabase = createServiceClient();
      await supabase
        .from("research_runs")
        .update({ status: "failed", phase: "failed" })
        .eq("id", runId);
      throw new Error(creditResult.error ?? "Insufficient credits");
    }

    // Update credits charged
    await step.run("mark-credits", async () => {
      const supabase = createServiceClient();
      await supabase
        .from("research_runs")
        .update({ credits_charged: 10 })
        .eq("id", runId);
    });

    await step.run("run-research", async () => {
      await runNicheResearch({
        runId,
        userId,
        niche,
        subNiches,
        personalAngle,
      });
    });

    // Advance onboarding if businessId provided (legacy flow)
    if (businessId) {
      await step.run("advance-onboarding", async () => {
        const supabase = createServiceClient();
        await supabase
          .from("businesses")
          .update({ onboarding_step: 2 })
          .eq("id", businessId);

        await supabase.from("activity_log").insert({
          business_id: businessId,
          type: "niche_researched",
          message: `Niche research completed for ${niche}`,
          metadata: { niche, subNiches, runId },
        });
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Ebook Generation (V1 pipeline: outline → draft → polish → save)
// ---------------------------------------------------------------------------

export const generateEbook = inngest.createFunction(
  { id: "generate-ebook", concurrency: { limit: 3 } },
  { event: "ebook/generation.requested" },
  async ({ event, step }) => {
    const { ebookId, userId, niche, personalAngle, researchRunId } = event.data;

    // Deduct credits
    const creditResult = await step.run("deduct-credits", async () => {
      return deductCredits(userId, "ebook_generation", ebookId);
    });

    if (!creditResult.success) {
      const supabase = createServiceClient();
      await supabase
        .from("ebooks")
        .update({ status: "draft" })
        .eq("id", ebookId);
      throw new Error(creditResult.error ?? "Insufficient credits");
    }

    await step.run("mark-credits", async () => {
      const supabase = createServiceClient();
      await supabase
        .from("ebooks")
        .update({ credits_charged: 50 })
        .eq("id", ebookId);
    });

    const result = await step.run("run-pipeline", async () => {
      return runEbookPipeline({
        ebookId,
        userId,
        niche,
        personalAngle,
        researchRunId,
      });
    });

    // Auto-trigger PDF generation
    await step.run("trigger-pdf", async () => {
      await inngest.send({
        name: "ebook/pdf.requested",
        data: {
          ebookId,
          userId,
          title: result.title,
          subtitle: result.subtitle,
          chapters: result.chapters,
          introduction: result.introduction,
          conclusion: result.conclusion,
        },
      });
    });

    // Auto-trigger cover generation
    await step.run("trigger-cover", async () => {
      await inngest.send({
        name: "ebook/cover.requested",
        data: {
          ebookId,
          userId,
          title: result.title,
          subtitle: result.subtitle,
          niche,
        },
      });
    });
  }
);

// ---------------------------------------------------------------------------
// Ebook PDF Generation
// ---------------------------------------------------------------------------

export const generateEbookPdf = inngest.createFunction(
  { id: "generate-ebook-pdf", concurrency: { limit: 2 } },
  { event: "ebook/pdf.requested" },
  async ({ event, step }) => {
    const { ebookId, userId, title, subtitle, chapters, introduction, conclusion } = event.data;

    await step.run("render-and-upload", async () => {
      const supabase = createServiceClient();

      // Build content array for PDF generator
      const pdfContent = [
        ...(introduction ? [{ chapterTitle: "Introduction", chapterContent: introduction }] : []),
        ...chapters.map((ch: { title: string; content: string }) => ({
          chapterTitle: ch.title,
          chapterContent: ch.content,
        })),
        ...(conclusion ? [{ chapterTitle: "Conclusion", chapterContent: conclusion }] : []),
      ];

      const pdfBuffer = await generateProductPdf({
        title,
        subtitle: subtitle ?? "",
        author: "Know24",
        content: pdfContent,
      });

      const storagePath = `${userId}/${ebookId}/ebook.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("ebooks")
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("ebooks")
        .getPublicUrl(storagePath);

      await supabase
        .from("ebooks")
        .update({
          pdf_url: publicUrl,
          pdf_storage_path: storagePath,
        })
        .eq("id", ebookId);
    });
  }
);

// ---------------------------------------------------------------------------
// Ebook Cover Generation
// ---------------------------------------------------------------------------

export const generateEbookCover = inngest.createFunction(
  { id: "generate-ebook-cover", concurrency: { limit: 2 } },
  { event: "ebook/cover.requested" },
  async ({ event, step }) => {
    const { ebookId, userId, title, subtitle, niche, style } = event.data;

    await step.run("generate-and-upload", async () => {
      const supabase = createServiceClient();

      const coverResult = await generateProductCover({
        title,
        subtitle,
        niche,
        productType: "ebook",
        style,
      });

      if (!coverResult) {
        throw new Error("Cover generation returned no image");
      }

      const storagePath = `${userId}/${ebookId}/cover.png`;
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(storagePath, coverResult.imageBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Cover upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(storagePath);

      await supabase
        .from("ebooks")
        .update({
          cover_url: publicUrl,
          cover_storage_path: storagePath,
        })
        .eq("id", ebookId);

      // Save to covers table for multi-option support
      await supabase.from("covers").insert({
        ebook_id: ebookId,
        user_id: userId,
        prompt: coverResult.prompt,
        image_url: publicUrl,
        storage_path: storagePath,
        selected: true,
      });
    });
  }
);

// ---------------------------------------------------------------------------
// Product Generation (legacy)
// ---------------------------------------------------------------------------

export const generateProduct = inngest.createFunction(
  { id: "generate-product", concurrency: { limit: 3 } },
  { event: "product/generation.requested" },
  async ({ event, step }) => {
    const { productId, businessId, productTypeSlug } = event.data;

    const knowledgeContext = await step.run("fetch-knowledge", async () => {
      const supabase = createServiceClient();

      const { data: research } = await supabase
        .from("research_documents")
        .select("research_data")
        .eq("business_id", businessId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (research?.research_data) {
        return JSON.stringify(research.research_data, null, 2);
      }

      const { data: chunks, error: chunksError } = await supabase
        .from("knowledge_chunks")
        .select("content")
        .eq("business_id", businessId)
        .order("chunk_index", { ascending: true })
        .limit(50);

      if (chunksError) {
        throw new Error(`Failed to fetch knowledge chunks: ${chunksError.message}`);
      }

      const context = (chunks ?? [])
        .map((c) => (c as { content: string }).content)
        .join("\n\n---\n\n");

      if (context.trim().length === 0) {
        throw new Error(`No knowledge context for business ${businessId}`);
      }

      return context;
    });

    await step.run("set-generating-status", async () => {
      const supabase = createServiceClient();
      await supabase
        .from("products")
        .update({ status: "generating" })
        .eq("id", productId)
        .eq("business_id", businessId);
    });

    await step.run("run-generator", async () => {
      const result = await runGenerator(productTypeSlug, businessId, productId, knowledgeContext);
      if (!result.success) {
        throw new Error(result.error ?? "Product generation failed");
      }
    });

    const productInfo = await step.run("log-and-fetch", async () => {
      const supabase = createServiceClient();
      await supabase.from("activity_log").insert({
        business_id: businessId,
        type: "product_generated",
        message: `Product generated successfully (${productTypeSlug})`,
        metadata: { productId, productTypeSlug },
      });

      const { data: product } = await supabase
        .from("products")
        .select("title, description")
        .eq("id", productId)
        .single();

      return product;
    });

    // Queue cover art generation
    if (productInfo) {
      await inngest.send({
        name: "product/cover.requested",
        data: {
          productId,
          businessId,
          title: productInfo.title,
          niche: "",
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// PDF Generation
// ---------------------------------------------------------------------------

export const generatePdf = inngest.createFunction(
  { id: "generate-pdf", concurrency: { limit: 2 } },
  { event: "product/pdf.requested" },
  async ({ event, step }) => {
    const { productId, businessId, title, content, chapters } = event.data;

    await step.run("render-and-upload-pdf", async () => {
      const supabase = createServiceClient();

      const { data: business } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", businessId)
        .single();

      const pdfBuffer = await generateProductPdf({
        title,
        subtitle: content.slice(0, 200),
        author: business?.name ?? "Know24",
        content: chapters.map((ch: { title: string; content: string }) => ({
          chapterTitle: ch.title,
          chapterContent: ch.content,
        })),
      });

      const storagePath = `${businessId}/${productId}/product.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("ebooks")
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

      await supabase.from("product_assets").insert({
        product_id: productId,
        business_id: businessId,
        asset_type: "pdf",
        r2_key: storagePath,
        r2_bucket: "ebooks",
        file_size_bytes: pdfBuffer.length,
        mime_type: "application/pdf",
        status: "completed",
      });

      await supabase.from("activity_log").insert({
        business_id: businessId,
        type: "pdf_generated",
        message: `PDF generated for "${title}"`,
        metadata: { productId },
      });
    });
  }
);

// ---------------------------------------------------------------------------
// Cover Art Generation
// ---------------------------------------------------------------------------

export const generateCover = inngest.createFunction(
  { id: "generate-cover-art", concurrency: { limit: 2 } },
  { event: "product/cover.requested" },
  async ({ event, step }) => {
    const { productId, businessId, title, niche, style } = event.data;

    await step.run("generate-and-upload-cover", async () => {
      const supabase = createServiceClient();

      const coverResult = await generateProductCover({
        title,
        niche,
        productType: "ebook",
        style,
      });

      if (!coverResult) {
        throw new Error("Cover generation failed");
      }

      const coverKey = `${businessId}/${productId}/cover.png`;
      const { error: coverUploadError } = await supabase.storage
        .from("covers")
        .upload(coverKey, coverResult.imageBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (coverUploadError) {
        throw new Error(`Failed to upload cover: ${coverUploadError.message}`);
      }

      await supabase.from("product_assets").insert({
        product_id: productId,
        business_id: businessId,
        asset_type: "cover_image",
        r2_key: coverKey,
        r2_bucket: "covers",
        file_size_bytes: coverResult.imageBuffer.length,
        mime_type: "image/png",
        status: "completed",
      });

      // OG image
      const ogBuffer = await generateOgImage({
        title,
        brandColor: "#0891b2",
        niche,
      });

      if (ogBuffer) {
        const ogKey = `${businessId}/${productId}/og-image.png`;
        const { error: ogUploadError } = await supabase.storage
          .from("covers")
          .upload(ogKey, ogBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (!ogUploadError) {
          await supabase.from("product_assets").insert({
            product_id: productId,
            business_id: businessId,
            asset_type: "og_image",
            r2_key: ogKey,
            r2_bucket: "covers",
            file_size_bytes: ogBuffer.length,
            mime_type: "image/png",
            status: "completed",
          });
        }
      }

      await supabase.from("activity_log").insert({
        business_id: businessId,
        type: "cover_art_generated",
        message: `Cover art generated for "${title}"`,
        metadata: { productId },
      });
    });
  }
);

// ---------------------------------------------------------------------------
// Storefront Build
// ---------------------------------------------------------------------------

export const buildStorefront = inngest.createFunction(
  { id: "build-storefront", concurrency: { limit: 2 } },
  { event: "storefront/build.requested" },
  async ({ event, step }) => {
    const { businessId, productId } = event.data;
    let { themeId } = event.data;

    await step.run("assemble-and-publish", async () => {
      const supabase = createServiceClient();

      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .select("name, niche, slug")
        .eq("id", businessId)
        .single();

      if (bizError || !business) {
        throw new Error(`Failed to fetch business: ${bizError?.message ?? "not found"}`);
      }

      const { data: product, error: prodError } = await supabase
        .from("products")
        .select("title, description, price_cents, slug")
        .eq("id", productId)
        .single();

      if (prodError || !product) {
        throw new Error(`Failed to fetch product: ${prodError?.message ?? "not found"}`);
      }

      const { data: research } = await supabase
        .from("research_documents")
        .select("research_data")
        .eq("business_id", businessId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!themeId) {
        const { data: firstTheme } = await supabase
          .from("storefront_themes")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (firstTheme) themeId = firstTheme.id;
      }

      const storefrontPayload = {
        theme_id: themeId,
        storefront_data: { product, research: research?.research_data ?? null, business },
        status: "published",
        published_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("storefronts")
        .select("id")
        .eq("business_id", businessId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("storefronts")
          .update(storefrontPayload)
          .eq("business_id", businessId);
        if (error) throw new Error(`Failed to update storefront: ${error.message}`);
      } else {
        const { error } = await supabase
          .from("storefronts")
          .insert({ business_id: businessId, ...storefrontPayload });
        if (error) throw new Error(`Failed to create storefront: ${error.message}`);
      }

      await supabase.from("activity_log").insert({
        business_id: businessId,
        type: "storefront_published",
        message: `Storefront published for "${business.name}"`,
        metadata: { productId, themeId },
      });
    });
  }
);

// ---------------------------------------------------------------------------
// Scout Scan
// ---------------------------------------------------------------------------

export const scoutScan = inngest.createFunction(
  { id: "run-scout-scan", concurrency: { limit: 3 } },
  { event: "scout/scan.requested" },
  async ({ event, step }) => {
    const { scanId, businessId } = event.data;

    await step.run("execute-scan", async () => {
      const result = await runScan(scanId, businessId);
      if (result.errors.length > 0) {
        console.error(`[scout-scan] scan=${scanId} errors:`, result.errors);
      }
    });
  }
);

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

export const sendEmail = inngest.createFunction(
  { id: "send-email", concurrency: { limit: 5 } },
  { event: "email/send.requested" },
  async ({ event, step }) => {
    const { businessId, sequenceType, recipientEmail, variables } = event.data;

    await step.run("send", async () => {
      const result = await triggerSequence(
        businessId,
        sequenceType,
        recipientEmail,
        variables ?? {}
      );
      if (!result.sent) {
        throw new Error(result.error ?? `Failed to send ${sequenceType} email`);
      }
    });
  }
);

// ---------------------------------------------------------------------------
// Email Sequence
// ---------------------------------------------------------------------------

export const executeEmailSequence = inngest.createFunction(
  { id: "execute-email-sequence", concurrency: { limit: 3 } },
  { event: "email/sequence.requested" },
  async ({ event, step }) => {
    const { businessId, sequenceId, subscriberEmail, subscriberName, stepId } = event.data;
    const resend = new Resend(process.env.RESEND_API_KEY);

    const supabase = createServiceClient();

    if (stepId) {
      await step.run("send-single-step", async () => {
        const { data: sequence } = await supabase
          .from("email_sequences")
          .select("is_active")
          .eq("id", sequenceId)
          .single();

        if (!sequence || !(sequence as unknown as { is_active: boolean }).is_active) {
          await supabase
            .from("email_sequence_sends")
            .update({ status: "cancelled" })
            .eq("sequence_id", sequenceId)
            .eq("step_id", stepId)
            .eq("recipient_email", subscriberEmail)
            .eq("status", "scheduled");
          return;
        }

        const { data: stepData } = await supabase
          .from("email_sequence_steps")
          .select("id, subject_template, body_template")
          .eq("id", stepId)
          .single();

        if (!stepData) throw new Error(`Step ${stepId} not found`);

        const typedStep = stepData as unknown as { id: string; subject_template: string; body_template: string };
        const vars = await buildVars(supabase, businessId, subscriberEmail, subscriberName);

        await sendAndRecord(resend, supabase, {
          sequenceId, stepId, businessId,
          to: subscriberEmail,
          subject: replaceVars(typedStep.subject_template, vars),
          htmlBody: replaceVars(typedStep.body_template, vars),
        });
      });
      return;
    }

    // Full sequence
    const steps = await step.run("fetch-sequence-steps", async () => {
      const { data: sequence } = await supabase
        .from("email_sequences")
        .select("id, business_id, name, is_active")
        .eq("id", sequenceId)
        .eq("business_id", businessId)
        .single();

      if (!sequence || !(sequence as unknown as { is_active: boolean }).is_active) return null;

      const { data: stepsData } = await supabase
        .from("email_sequence_steps")
        .select("id, sequence_id, subject_template, body_template, delay_hours, sort_order")
        .eq("sequence_id", sequenceId)
        .order("sort_order", { ascending: true });

      return stepsData;
    });

    if (!steps || steps.length === 0) return;

    const vars = await step.run("build-vars", async () => {
      return buildVars(supabase, businessId, subscriberEmail, subscriberName);
    });

    for (const s of steps as unknown as Array<{ id: string; subject_template: string; body_template: string; delay_hours: number }>) {
      if (s.delay_hours === 0) {
        await step.run(`send-step-${s.id}`, async () => {
          await sendAndRecord(resend, supabase, {
            sequenceId, stepId: s.id, businessId,
            to: subscriberEmail,
            subject: replaceVars(s.subject_template, vars),
            htmlBody: replaceVars(s.body_template, vars),
          });
        });
      } else {
        await step.sleep(`wait-${s.id}`, `${s.delay_hours}h`);
        await step.run(`send-delayed-step-${s.id}`, async () => {
          await sendAndRecord(resend, supabase, {
            sequenceId, stepId: s.id, businessId,
            to: subscriberEmail,
            subject: replaceVars(s.subject_template, vars),
            htmlBody: replaceVars(s.body_template, vars),
          });
        });
      }
    }
  }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function replaceVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

async function buildVars(
  supabase: ReturnType<typeof createServiceClient>,
  businessId: string,
  email: string,
  name?: string
): Promise<Record<string, string>> {
  const { data: business } = await supabase
    .from("businesses")
    .select("name, niche")
    .eq("id", businessId)
    .single();

  const biz = business as unknown as { name: string; niche: string } | null;

  return {
    business_name: biz?.name ?? "",
    business_niche: biz?.niche ?? "",
    recipient_email: email,
    subscriber_name: name ?? "",
    subscriber_email: email,
  };
}

async function sendAndRecord(
  resend: Resend,
  supabase: ReturnType<typeof createServiceClient>,
  params: {
    sequenceId: string;
    stepId: string;
    businessId: string;
    to: string;
    subject: string;
    htmlBody: string;
  }
): Promise<void> {
  const { sequenceId, stepId, businessId, to, subject, htmlBody } = params;

  try {
    await resend.emails.send({
      from: "Know24 <noreply@know24.io>",
      to,
      subject,
      html: htmlBody,
    });

    const { data: existing } = await supabase
      .from("email_sequence_sends")
      .select("id")
      .eq("sequence_id", sequenceId)
      .eq("step_id", stepId)
      .eq("recipient_email", to)
      .eq("status", "scheduled")
      .single();

    if (existing) {
      await supabase
        .from("email_sequence_sends")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", (existing as unknown as { id: string }).id);
    } else {
      await supabase.from("email_sequence_sends").insert({
        sequence_id: sequenceId,
        step_id: stepId,
        business_id: businessId,
        recipient_email: to,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("email_sequence_sends").insert({
      sequence_id: sequenceId,
      step_id: stepId,
      business_id: businessId,
      recipient_email: to,
      status: "failed",
      error_message: message,
    });
    throw new Error(`Failed to send email: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Export all functions for the serve handler
// ---------------------------------------------------------------------------

export const inngestFunctions = [
  researchNiche,
  generateEbook,
  generateEbookPdf,
  generateEbookCover,
  generateProduct,
  generatePdf,
  generateCover,
  buildStorefront,
  scoutScan,
  sendEmail,
  executeEmailSequence,
];
