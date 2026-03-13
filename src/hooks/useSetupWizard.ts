import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  SetupWizardState,
  KnowledgeIntakeData,
  UploadedFile,
  AIAnalysisResult,
  BuildProductItem,
  StorefrontPalette,
} from "@/types/setup";

const initialKnowledgeIntake: KnowledgeIntakeData = {
  urls: [],
  uploadedFiles: [],
  videoLinks: [],
  interviewCompleted: false,
  interviewTranscript: "",
};

export const useSetupWizard = create<SetupWizardState>()(
  persist(
    (set) => ({
  currentStep: 1,
  businessId: null,
  businessName: "",
  businessSlug: "",
  niche: "",

  knowledgeIntake: initialKnowledgeIntake,
  aiAnalysis: null,
  analysisLoading: false,
  selectedProductTypes: [],
  buildItems: [],
  buildComplete: false,
  selectedPalette: "A",

  setStep: (step: number) => set({ currentStep: step }),

  setBusinessInfo: (info: { id: string; name: string; slug: string; niche: string }) =>
    set({ businessId: info.id, businessName: info.name, businessSlug: info.slug, niche: info.niche }),

  addUrl: (url: string) =>
    set((state) => ({
      knowledgeIntake: {
        ...state.knowledgeIntake,
        urls: [...state.knowledgeIntake.urls, url],
      },
    })),

  removeUrl: (url: string) =>
    set((state) => ({
      knowledgeIntake: {
        ...state.knowledgeIntake,
        urls: state.knowledgeIntake.urls.filter((u) => u !== url),
      },
    })),

  addUploadedFile: (file: UploadedFile) =>
    set((state) => ({
      knowledgeIntake: {
        ...state.knowledgeIntake,
        uploadedFiles: [...state.knowledgeIntake.uploadedFiles, file],
      },
    })),

  removeUploadedFile: (id: string) =>
    set((state) => ({
      knowledgeIntake: {
        ...state.knowledgeIntake,
        uploadedFiles: state.knowledgeIntake.uploadedFiles.filter((f) => f.id !== id),
      },
    })),

  addVideoLink: (url: string) =>
    set((state) => ({
      knowledgeIntake: {
        ...state.knowledgeIntake,
        videoLinks: [...state.knowledgeIntake.videoLinks, url],
      },
    })),

  removeVideoLink: (url: string) =>
    set((state) => ({
      knowledgeIntake: {
        ...state.knowledgeIntake,
        videoLinks: state.knowledgeIntake.videoLinks.filter((v) => v !== url),
      },
    })),

  setInterviewCompleted: (completed: boolean, transcript: string) =>
    set((state) => ({
      knowledgeIntake: {
        ...state.knowledgeIntake,
        interviewCompleted: completed,
        interviewTranscript: transcript,
      },
    })),

  setAIAnalysis: (analysis: AIAnalysisResult | null) => set({ aiAnalysis: analysis }),

  setAnalysisLoading: (loading: boolean) => set({ analysisLoading: loading }),

  toggleProductType: (slug: string) =>
    set((state) => ({
      selectedProductTypes: state.selectedProductTypes.includes(slug)
        ? state.selectedProductTypes.filter((s) => s !== slug)
        : [...state.selectedProductTypes, slug],
    })),

  setSelectedProductTypes: (slugs: string[]) => set({ selectedProductTypes: slugs }),

  setBuildItems: (items: BuildProductItem[]) => set({ buildItems: items }),

  updateBuildItem: (slug: string, status: BuildProductItem["status"], errorMessage?: string) =>
    set((state) => ({
      buildItems: state.buildItems.map((item) =>
        item.productTypeSlug === slug ? { ...item, status, errorMessage } : item
      ),
    })),

  setBuildComplete: (complete: boolean) => set({ buildComplete: complete }),

  setSelectedPalette: (palette: StorefrontPalette) => set({ selectedPalette: palette }),

  reset: () =>
    set({
      currentStep: 1,
      businessId: null,
      businessName: "",
      businessSlug: "",
      niche: "",
      knowledgeIntake: initialKnowledgeIntake,
      aiAnalysis: null,
      analysisLoading: false,
      selectedProductTypes: [],
      buildItems: [],
      buildComplete: false,
      selectedPalette: "A",
    }),
    }),
    {
      name: "know24-setup-wizard",
      partialize: (state: SetupWizardState) => ({
        currentStep: state.currentStep,
        businessId: state.businessId,
        businessName: state.businessName,
        businessSlug: state.businessSlug,
        niche: state.niche,
        knowledgeIntake: state.knowledgeIntake,
        aiAnalysis: state.aiAnalysis,
        selectedProductTypes: state.selectedProductTypes,
        buildItems: state.buildItems,
        buildComplete: state.buildComplete,
        selectedPalette: state.selectedPalette,
      }),
    }
  )
);
