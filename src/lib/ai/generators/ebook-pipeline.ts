/**
 * Multi-step ebook generation pipeline:
 *   1. Outline (Gemini Flash) — structure from research
 *   2. Draft chapters (Gemini Flash) — parallel chapter generation
 *   3. Polish (Claude Sonnet) — quality refinement per chapter
 *   4. Assemble — save to ebooks table
 */

import { generateObject, generateText } from "ai";
import { z } from "zod";
import { primaryModel, reasoningModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

// ── Schemas ──────────────────────────────────────────────────────────────────

const OutlineSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  introduction: z.string().describe("150-200 word introduction"),
  chapters: z.array(z.object({
    title: z.string(),
    keyPoints: z.array(z.string()).describe("3-5 key points this chapter covers"),
    targetWords: z.number().describe("Target word count, 800-1500"),
  })),
  conclusion: z.string().describe("100-150 word conclusion outline"),
  keyTakeaways: z.array(z.string()).describe("5-7 key takeaways"),
});

type EbookOutline = z.infer<typeof OutlineSchema>;

export interface EbookChapter {
  title: string;
  content: string;
  wordCount: number;
}

export interface EbookGenerationResult {
  title: string;
  subtitle: string;
  introduction: string;
  chapters: EbookChapter[];
  conclusion: string;
  keyTakeaways: string[];
  totalWords: number;
  totalPages: number;
}

// ── Step 1: Generate Outline ─────────────────────────────────────────────────

export async function generateOutline(
  niche: string,
  personalAngle: string | null,
  researchBlueprint: unknown
): Promise<EbookOutline> {
  const { object } = await generateObject({
    model: primaryModel,
    schema: OutlineSchema,
    prompt: `You are a bestselling ebook author. Create a detailed outline for an ebook in the "${niche}" niche.

${researchBlueprint ? `Market Research:\n${JSON.stringify(researchBlueprint, null, 2)}` : ""}
${personalAngle ? `Creator's Unique Angle: ${personalAngle}` : ""}

Requirements:
- 6-10 chapters, each substantial (800-1500 words target)
- Start with foundational concepts, build to advanced strategies
- Include actionable frameworks, not just theory
- Each chapter should stand alone as valuable but build on previous ones
- Title should be benefit-driven and specific (not generic)
- Introduction should hook the reader with a specific promise
- Key takeaways should be actionable, not vague`,
  });

  return object;
}

// ── Step 2: Draft Chapters (parallel) ────────────────────────────────────────

export async function draftChapter(
  bookTitle: string,
  chapter: { title: string; keyPoints: string[]; targetWords: number },
  chapterIndex: number,
  totalChapters: number,
  niche: string
): Promise<EbookChapter> {
  const { text } = await generateText({
    model: primaryModel,
    system: `You are a professional ebook author writing chapter ${chapterIndex + 1} of ${totalChapters} for "${bookTitle}". Write in a clear, authoritative, conversational tone. Include specific examples, actionable steps, and frameworks. Do NOT use markdown — write in clean prose with natural paragraph breaks.`,
    prompt: `Write Chapter ${chapterIndex + 1}: "${chapter.title}"

Key points to cover:
${chapter.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Target: ${chapter.targetWords} words. Niche: ${niche}.

Write the full chapter content now. Start directly with the content — do not repeat the chapter title.`,
  });

  return {
    title: chapter.title,
    content: text.trim(),
    wordCount: text.trim().split(/\s+/).length,
  };
}

// ── Step 3: Polish Chapter (Claude Sonnet) ───────────────────────────────────

export async function polishChapter(chapter: EbookChapter): Promise<EbookChapter> {
  const { text } = await generateText({
    model: reasoningModel,
    system: `You are a professional editor. Your job is to polish and improve ebook chapter drafts. Fix any awkward phrasing, strengthen weak arguments, add transitions, ensure consistent tone, and improve clarity. Keep the same structure and length — do not shorten significantly. Output ONLY the improved chapter text, nothing else.`,
    prompt: `Polish this chapter draft:

Chapter: "${chapter.title}"

${chapter.content}`,
  });

  return {
    title: chapter.title,
    content: text.trim(),
    wordCount: text.trim().split(/\s+/).length,
  };
}

// ── Step 4: Full Pipeline ────────────────────────────────────────────────────

interface PipelineOptions {
  ebookId: string;
  userId: string;
  niche: string;
  personalAngle?: string | null;
  researchRunId?: string | null;
  onProgress?: (phase: string, detail: string, progress: number) => void;
}

export async function runEbookPipeline(opts: PipelineOptions): Promise<EbookGenerationResult> {
  const { ebookId, userId, niche, personalAngle, researchRunId, onProgress } = opts;
  const supabase = createServiceClient();

  // Update status
  await supabase
    .from("ebooks")
    .update({ status: "generating" })
    .eq("id", ebookId);

  onProgress?.("outline", "Generating ebook outline...", 10);

  // Fetch research if available
  let researchBlueprint: unknown = null;
  if (researchRunId) {
    const { data: run } = await supabase
      .from("research_runs")
      .select("blueprint")
      .eq("id", researchRunId)
      .single();
    researchBlueprint = run?.blueprint ?? null;
  }

  // Step 1: Outline
  const outline = await generateOutline(niche, personalAngle ?? null, researchBlueprint);

  onProgress?.("drafting", `Drafting ${outline.chapters.length} chapters...`, 25);

  // Update ebook with outline metadata
  await supabase
    .from("ebooks")
    .update({
      title: outline.title,
      subtitle: outline.subtitle,
    })
    .eq("id", ebookId);

  // Step 2: Draft all chapters in parallel (batches of 3 to avoid rate limits)
  const draftedChapters: EbookChapter[] = [];
  const batchSize = 3;

  for (let i = 0; i < outline.chapters.length; i += batchSize) {
    const batch = outline.chapters.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((ch, batchIdx) =>
        draftChapter(outline.title, ch, i + batchIdx, outline.chapters.length, niche)
      )
    );
    draftedChapters.push(...results);

    const progress = 25 + Math.round(((i + batch.length) / outline.chapters.length) * 35);
    onProgress?.("drafting", `Drafted ${draftedChapters.length}/${outline.chapters.length} chapters`, progress);
  }

  // Step 3: Polish all chapters with Claude (batches of 2)
  onProgress?.("polishing", "Polishing chapters with Claude...", 65);

  const polishedChapters: EbookChapter[] = [];
  const polishBatchSize = 2;

  for (let i = 0; i < draftedChapters.length; i += polishBatchSize) {
    const batch = draftedChapters.slice(i, i + polishBatchSize);
    const results = await Promise.all(batch.map(polishChapter));
    polishedChapters.push(...results);

    const progress = 65 + Math.round(((i + batch.length) / draftedChapters.length) * 25);
    onProgress?.("polishing", `Polished ${polishedChapters.length}/${draftedChapters.length} chapters`, progress);
  }

  // Step 4: Assemble final ebook
  const totalWords = polishedChapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    + outline.introduction.split(/\s+/).length
    + outline.conclusion.split(/\s+/).length;
  const totalPages = Math.ceil(totalWords / 250); // ~250 words per page

  const result: EbookGenerationResult = {
    title: outline.title,
    subtitle: outline.subtitle,
    introduction: outline.introduction,
    chapters: polishedChapters,
    conclusion: outline.conclusion,
    keyTakeaways: outline.keyTakeaways,
    totalWords,
    totalPages,
  };

  // Save to ebooks table
  await supabase
    .from("ebooks")
    .update({
      title: result.title,
      subtitle: result.subtitle,
      chapters: result.chapters,
      total_words: result.totalWords,
      total_pages: result.totalPages,
      niche,
      personal_angle: personalAngle ?? null,
      research_run_id: researchRunId ?? null,
      status: "reviewing",
      generation_model: "gemini-flash+claude-sonnet",
    })
    .eq("id", ebookId);

  onProgress?.("complete", "Ebook generation complete!", 100);

  return result;
}
