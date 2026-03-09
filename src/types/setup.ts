export interface KnowledgeIntakeData {
  urls: string[];
  uploadedFiles: UploadedFile[];
  videoLinks: string[];
  interviewCompleted: boolean;
  interviewTranscript: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  r2Key: string;
  status: "uploading" | "uploaded" | "processing" | "processed" | "error";
}

export interface RecommendedProduct {
  productTypeSlug: string;
  reason: string;
  suggestedTitle: string;
}

export interface AIAnalysisResult {
  knowledgeSummary: string;
  topics: string[];
  recommendedProducts: RecommendedProduct[];
}

export interface BuildProductItem {
  productTypeSlug: string;
  displayName: string;
  iconName: string;
  status: "queued" | "building" | "complete" | "error";
  errorMessage?: string;
}

export type StorefrontPalette = "A" | "B" | "C" | "D";

export interface PaletteConfig {
  id: StorefrontPalette;
  name: string;
  headerColor: string;
  accentColor: string;
  description: string;
}

export interface SetupWizardState {
  currentStep: number;
  businessId: string | null;
  businessName: string;
  businessSlug: string;
  niche: string;

  // Step 1
  knowledgeIntake: KnowledgeIntakeData;

  // Step 2
  aiAnalysis: AIAnalysisResult | null;
  analysisLoading: boolean;

  // Step 3
  selectedProductTypes: string[];

  // Step 4
  buildItems: BuildProductItem[];
  buildComplete: boolean;

  // Step 5
  selectedPalette: StorefrontPalette;

  // Actions
  setStep: (step: number) => void;
  setBusinessInfo: (info: { id: string; name: string; slug: string; niche: string }) => void;
  addUrl: (url: string) => void;
  removeUrl: (url: string) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  addVideoLink: (url: string) => void;
  removeVideoLink: (url: string) => void;
  setInterviewCompleted: (completed: boolean, transcript: string) => void;
  setAIAnalysis: (analysis: AIAnalysisResult | null) => void;
  setAnalysisLoading: (loading: boolean) => void;
  toggleProductType: (slug: string) => void;
  setSelectedProductTypes: (slugs: string[]) => void;
  setBuildItems: (items: BuildProductItem[]) => void;
  updateBuildItem: (slug: string, status: BuildProductItem["status"], errorMessage?: string) => void;
  setBuildComplete: (complete: boolean) => void;
  setSelectedPalette: (palette: StorefrontPalette) => void;
  reset: () => void;
}
