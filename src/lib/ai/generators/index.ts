import { generateCheatSheet } from "./cheat-sheet";
import { generateEmailCourse } from "./email-course";
import { generateFrameworkTemplatePack } from "./framework-template-pack";
import { generateGuideEbook } from "./guide-ebook";
import { generatePromptPack } from "./prompt-pack";
import { generateResourceDirectory } from "./resource-directory";
import { generateSwipeFile } from "./swipe-file";
import { generateWorksheetWorkbook } from "./worksheet-workbook";

export interface GeneratorResult {
  success: boolean;
  error?: string;
}

type GeneratorFn = (
  businessId: string,
  productId: string,
  knowledgeContext: string
) => Promise<GeneratorResult>;

const generators: Record<string, GeneratorFn> = {
  "cheat-sheet": generateCheatSheet,
  "email-course": generateEmailCourse,
  "framework-template-pack": generateFrameworkTemplatePack,
  "guide-ebook": generateGuideEbook,
  "prompt-pack": generatePromptPack,
  "resource-directory": generateResourceDirectory,
  "swipe-file": generateSwipeFile,
  "worksheet-workbook": generateWorksheetWorkbook,
};

/**
 * Dispatch to the correct product generator based on the product type slug.
 * Throws if the slug is unrecognized.
 */
export async function runGenerator(
  slug: string,
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  const generator = generators[slug];
  if (!generator) {
    throw new Error(`Unknown product type slug: ${slug}`);
  }
  return generator(businessId, productId, knowledgeContext);
}
