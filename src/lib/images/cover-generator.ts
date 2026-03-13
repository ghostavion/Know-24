/**
 * AI Cover Art Generator — uses Google Imagen 3 via REST API
 */

export interface CoverGenerationResult {
  imageBuffer: Buffer;
  prompt: string;
}

interface ImagenResponse {
  predictions?: Array<{
    bytesBase64Encoded?: string;
    mimeType?: string;
  }>;
}

async function callImagen(prompt: string, aspectRatio: string): Promise<Buffer | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio,
        personGeneration: "dont_allow",
      },
    }),
  });

  if (!response.ok) {
    console.error(`Imagen API error: ${response.status} ${response.statusText}`);
    return null;
  }

  const data = (await response.json()) as ImagenResponse;
  const imageData = data.predictions?.[0]?.bytesBase64Encoded;

  if (!imageData) return null;
  return Buffer.from(imageData, "base64");
}

export async function generateProductCover(options: {
  title: string;
  subtitle?: string;
  niche: string;
  productType: string;
  style?: "minimalist" | "bold" | "photographic" | "illustrated" | "gradient";
}): Promise<CoverGenerationResult | null> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn("GOOGLE_GENERATIVE_AI_API_KEY not set, skipping cover generation");
    return null;
  }

  const styleGuide = {
    minimalist:
      "Clean, white background, simple geometric shapes, modern sans-serif typography, lots of whitespace, subtle accent color",
    bold: "Vibrant colors, large bold typography, striking contrast, energetic composition, dark background",
    photographic:
      "Professional stock photo style background related to the topic, semi-transparent overlay, clean white text",
    illustrated:
      "Hand-drawn illustration style, warm colors, friendly aesthetic, artisanal feel",
    gradient:
      "Modern gradient background, glassmorphic elements, clean typography, tech-forward aesthetic",
  };

  const style = options.style ?? "minimalist";

  const prompt = `Create a professional digital product cover for an ${options.productType} titled "${options.title}"${options.subtitle ? ` with subtitle "${options.subtitle}"` : ""} in the ${options.niche} niche. Style: ${styleGuide[style]}. The cover should look like a premium, professionally designed product. Portrait orientation, book cover ratio. Do NOT include any text on the image -- text will be overlaid programmatically.`;

  try {
    const imageBuffer = await callImagen(prompt, "3:4");

    if (!imageBuffer) {
      console.error("No image data in Imagen response");
      return null;
    }

    return { imageBuffer, prompt };
  } catch (error) {
    console.error("Cover generation error:", error);
    return null;
  }
}

export async function generateOgImage(options: {
  title: string;
  brandColor: string;
  niche: string;
}): Promise<Buffer | null> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;

  try {
    return await callImagen(
      `Create a modern, clean Open Graph social sharing image for a digital product called "${options.title}" in the ${options.niche} niche. Use ${options.brandColor} as the accent color. Professional, minimal design with abstract shapes. Do NOT include text.`,
      "16:9"
    );
  } catch {
    return null;
  }
}
