export interface ProductTypeConfig {
  slug: string;
  displayName: string;
  description: string;
  iconName: string;
  category: "static" | "interactive" | "ai";
  isAiProduct: boolean;
}

export const PRODUCT_TYPES: ProductTypeConfig[] = [
  // Static Products
  {
    slug: "guide_ebook",
    displayName: "Guide / eBook",
    description: "Long-form PDF with structured chapters and actionable takeaways.",
    iconName: "BookOpen",
    category: "static",
    isAiProduct: false,
  },
  {
    slug: "framework_template_pack",
    displayName: "Framework / Template Pack",
    description: "Fillable templates, checklists, and SOPs your audience can use right away.",
    iconName: "Layout",
    category: "static",
    isAiProduct: false,
  },
  {
    slug: "cheat_sheet",
    displayName: "Cheat Sheet",
    description: "Condensed 1–3 page reference card with key concepts at a glance.",
    iconName: "FileText",
    category: "static",
    isAiProduct: false,
  },
  {
    slug: "worksheet_workbook",
    displayName: "Worksheet / Workbook",
    description: "Interactive exercises with guided reflection prompts.",
    iconName: "PenTool",
    category: "static",
    isAiProduct: false,
  },
  {
    slug: "swipe_file",
    displayName: "Swipe File / Script Library",
    description: "Copy-paste scripts and templates for common situations.",
    iconName: "Copy",
    category: "static",
    isAiProduct: false,
  },
  {
    slug: "resource_directory",
    displayName: "Resource Directory",
    description: "Curated list of tools, links, and resources in your niche.",
    iconName: "List",
    category: "static",
    isAiProduct: false,
  },
  {
    slug: "prompt_pack",
    displayName: "Prompt Pack / Toolkit",
    description: "Curated AI prompts designed for a specific workflow.",
    iconName: "Zap",
    category: "static",
    isAiProduct: false,
  },
  // Interactive Products
  {
    slug: "email_course",
    displayName: "Email Course",
    description: "5–7 day educational drip sequence delivered to their inbox.",
    iconName: "Mail",
    category: "interactive",
    isAiProduct: false,
  },
  {
    slug: "assessment_quiz",
    displayName: "Assessment / Quiz",
    description: "Self-evaluation with scoring and personalized recommendations.",
    iconName: "CheckSquare",
    category: "interactive",
    isAiProduct: false,
  },
  {
    slug: "mini_course",
    displayName: "Mini-Course",
    description: "Multi-module lessons with bite-sized content and progress tracking.",
    iconName: "Monitor",
    category: "interactive",
    isAiProduct: false,
  },
  // AI Products
  {
    slug: "chatbot",
    displayName: "Chatbot",
    description: "Conversational access to your knowledge — like having a clone of you.",
    iconName: "MessageCircle",
    category: "ai",
    isAiProduct: true,
  },
  {
    slug: "expert_engine",
    displayName: "Expert Engine",
    description: "Your knowledge as a structured API service other apps can query.",
    iconName: "Cpu",
    category: "ai",
    isAiProduct: true,
  },
];

export const STOREFRONT_PALETTES = [
  {
    id: "A" as const,
    name: "Ocean Professional",
    headerColor: "#1e293b",
    accentColor: "#f97316",
    description: "Navy header with warm coral accents — clean and trustworthy.",
  },
  {
    id: "B" as const,
    name: "Forest Authority",
    headerColor: "#14532d",
    accentColor: "#f59e0b",
    description: "Deep green header with amber accents — earthy and authoritative.",
  },
  {
    id: "C" as const,
    name: "Purple Expertise",
    headerColor: "#3b0764",
    accentColor: "#ec4899",
    description: "Deep purple header with pink accents — bold and creative.",
  },
  {
    id: "D" as const,
    name: "Slate Modern",
    headerColor: "#0f172a",
    accentColor: "#6366f1",
    description: "Charcoal header with indigo accents — sleek and modern.",
  },
] as const;
