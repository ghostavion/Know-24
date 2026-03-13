export interface StorefrontTheme {
  id: string;
  name: string;
  slug: string;
  description: string;
  heroLayout: "centered" | "split" | "full-width" | "minimal" | "gradient" | "card";
  colors: {
    primary: string;
    primaryHover: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    accent: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    heroSize: string;
    sectionSize: string;
  };
  sections: string[];
  borderRadius: string;
  shadow: string;
  spacing: "compact" | "default" | "generous";
}

export const STOREFRONT_THEMES: StorefrontTheme[] = [
  {
    id: "theme_starter",
    name: "Starter",
    slug: "starter",
    description: "Clean, simple, and versatile. A white canvas that works for any niche.",
    heroLayout: "centered",
    colors: {
      primary: "#0891b2",
      primaryHover: "#0e7490",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#0f172a",
      textMuted: "#64748b",
      border: "#e2e8f0",
      accent: "#0891b2",
    },
    typography: {
      headingFont: "'Inter', system-ui, sans-serif",
      bodyFont: "'Inter', system-ui, sans-serif",
      heroSize: "text-5xl md:text-6xl",
      sectionSize: "text-3xl",
    },
    sections: ["nav", "hero", "features", "social-proof", "pricing", "faq", "cta", "footer"],
    borderRadius: "rounded-xl",
    shadow: "shadow-md",
    spacing: "generous",
  },
  {
    id: "theme_professional",
    name: "Professional",
    slug: "professional",
    description: "Dark header with a light body. Ideal for business, finance, and consulting.",
    heroLayout: "split",
    colors: {
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      background: "#ffffff",
      surface: "#f1f5f9",
      text: "#0f172a",
      textMuted: "#475569",
      border: "#e2e8f0",
      accent: "#2563eb",
    },
    typography: {
      headingFont: "'Inter', system-ui, sans-serif",
      bodyFont: "'Inter', system-ui, sans-serif",
      heroSize: "text-4xl md:text-5xl",
      sectionSize: "text-2xl",
    },
    sections: ["nav", "hero", "features", "social-proof", "pricing", "faq", "cta", "footer"],
    borderRadius: "rounded-lg",
    shadow: "shadow-lg",
    spacing: "default",
  },
  {
    id: "theme_creative",
    name: "Creative",
    slug: "creative",
    description: "Gradient hero with playful vibes. Perfect for arts, design, and creative niches.",
    heroLayout: "gradient",
    colors: {
      primary: "#ec4899",
      primaryHover: "#db2777",
      background: "#ffffff",
      surface: "#fdf2f8",
      text: "#1e1b4b",
      textMuted: "#6b7280",
      border: "#f3e8ff",
      accent: "#ec4899",
    },
    typography: {
      headingFont: "'Inter', system-ui, sans-serif",
      bodyFont: "'Inter', system-ui, sans-serif",
      heroSize: "text-5xl md:text-6xl",
      sectionSize: "text-3xl",
    },
    sections: ["nav", "hero", "features", "social-proof", "pricing", "faq", "cta", "footer"],
    borderRadius: "rounded-2xl",
    shadow: "shadow-xl",
    spacing: "generous",
  },
  {
    id: "theme_minimal",
    name: "Minimal",
    slug: "minimal",
    description: "Ultra-clean with generous whitespace. Inspired by Linear and Notion.",
    heroLayout: "minimal",
    colors: {
      primary: "#18181b",
      primaryHover: "#27272a",
      background: "#ffffff",
      surface: "#fafafa",
      text: "#18181b",
      textMuted: "#71717a",
      border: "#e4e4e7",
      accent: "#18181b",
    },
    typography: {
      headingFont: "'Inter', system-ui, sans-serif",
      bodyFont: "'Inter', system-ui, sans-serif",
      heroSize: "text-4xl md:text-5xl",
      sectionSize: "text-2xl",
    },
    sections: ["nav", "hero", "features", "pricing", "faq", "footer"],
    borderRadius: "rounded-md",
    shadow: "shadow-sm",
    spacing: "generous",
  },
  {
    id: "theme_bold",
    name: "Bold",
    slug: "bold",
    description: "Full-width hero with strong colors and large text. Built for marketing and sales.",
    heroLayout: "full-width",
    colors: {
      primary: "#facc15",
      primaryHover: "#eab308",
      background: "#ffffff",
      surface: "#fafaf9",
      text: "#0c0a09",
      textMuted: "#57534e",
      border: "#e7e5e4",
      accent: "#facc15",
    },
    typography: {
      headingFont: "'Inter', system-ui, sans-serif",
      bodyFont: "'Inter', system-ui, sans-serif",
      heroSize: "text-5xl md:text-7xl",
      sectionSize: "text-3xl md:text-4xl",
    },
    sections: ["nav", "hero", "features", "social-proof", "pricing", "cta", "footer"],
    borderRadius: "rounded-none",
    shadow: "shadow-lg",
    spacing: "default",
  },
  {
    id: "theme_warm",
    name: "Warm",
    slug: "warm",
    description: "Soft, inviting tones with serif headings. Ideal for health, wellness, and parenting.",
    heroLayout: "card",
    colors: {
      primary: "#16a34a",
      primaryHover: "#15803d",
      background: "#faf5ef",
      surface: "#ffffff",
      text: "#292524",
      textMuted: "#78716c",
      border: "#e7e5e4",
      accent: "#16a34a",
    },
    typography: {
      headingFont: "'Georgia', 'Times New Roman', serif",
      bodyFont: "'Inter', system-ui, sans-serif",
      heroSize: "text-4xl md:text-5xl",
      sectionSize: "text-3xl",
    },
    sections: ["nav", "hero", "features", "social-proof", "pricing", "faq", "cta", "footer"],
    borderRadius: "rounded-2xl",
    shadow: "shadow-md",
    spacing: "generous",
  },
];

export function getThemeBySlug(slug: string): StorefrontTheme {
  return STOREFRONT_THEMES.find((t) => t.slug === slug) ?? STOREFRONT_THEMES[0];
}

export function getThemeById(id: string): StorefrontTheme {
  return STOREFRONT_THEMES.find((t) => t.id === id) ?? STOREFRONT_THEMES[0];
}
