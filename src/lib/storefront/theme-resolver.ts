/**
 * Resolves the best storefront theme for a given niche slug.
 * Falls back to "starter" if the niche is not mapped.
 */
export function resolveThemeForNiche(niche: string): string {
  const nicheThemeMap: Record<string, string> = {
    "health-wellness": "warm",
    "finance-investing": "professional",
    "marketing-sales": "bold",
    "technology-development": "minimal",
    "education-learning": "starter",
    "creative-arts-design": "creative",
    "food-cooking": "warm",
    "business-strategy": "professional",
    "parenting-family": "warm",
    "real-estate": "professional",
    "fitness-sports": "bold",
    "mental-health-mindfulness": "warm",
    "personal-development": "starter",
    "travel-lifestyle": "creative",
    "music-audio": "creative",
    "photography-video": "creative",
    "writing-publishing": "minimal",
    "ecommerce-dropshipping": "bold",
    "saas-software": "minimal",
    "consulting-coaching": "professional",
  };

  return nicheThemeMap[niche] ?? "starter";
}
