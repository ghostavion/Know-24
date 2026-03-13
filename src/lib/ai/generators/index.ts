import { generateGuideEbook } from "./guide-ebook";

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
  "guide-ebook": generateGuideEbook,
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
