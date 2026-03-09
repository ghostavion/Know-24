"use client";

import {
  BookOpen,
  Layout,
  FileText,
  PenTool,
  Copy,
  List,
  Zap,
  Mail,
  CheckSquare,
  Monitor,
  MessageCircle,
  Cpu,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useSetupWizard } from "@/hooks/useSetupWizard";
import { PRODUCT_TYPES } from "@/lib/constants/product-types";
import type { ProductTypeConfig } from "@/lib/constants/product-types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Layout,
  FileText,
  PenTool,
  Copy,
  List,
  Zap,
  Mail,
  CheckSquare,
  Monitor,
  MessageCircle,
  Cpu,
};

const CATEGORY_LABELS: Record<ProductTypeConfig["category"], string> = {
  static: "Static Products",
  interactive: "Interactive Products",
  ai: "AI-Powered Products",
};

const CATEGORY_ORDER: ProductTypeConfig["category"][] = [
  "static",
  "interactive",
  "ai",
];

interface ProductSelectionStepProps {
  className?: string;
}

const ProductSelectionStep = ({ className }: ProductSelectionStepProps) => {
  const { selectedProductTypes, toggleProductType } = useSetupWizard();

  const groupedProducts = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    products: PRODUCT_TYPES.filter((pt) => pt.category === category),
  }));

  const selectedCount = selectedProductTypes.length;

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Choose Your Products</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the product types you&apos;d like us to generate. You can
          choose as many as you like.
        </p>
      </div>

      {/* Category sections */}
      {groupedProducts.map(({ category, label, products }) => (
        <div key={category}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {products.map((product) => {
              const Icon = ICON_MAP[product.iconName] ?? FileText;
              const isSelected = selectedProductTypes.includes(product.slug);

              return (
                <button
                  key={product.slug}
                  type="button"
                  onClick={() => toggleProductType(product.slug)}
                  className={cn(
                    "relative cursor-pointer rounded-xl border p-4 text-left transition-all",
                    isSelected
                      ? "border-[#0891b2] bg-[#0891b2]/5"
                      : "border-border hover:border-[#0891b2]/50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute right-2 top-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0891b2] text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                  <Icon className="h-6 w-6 text-[#0891b2]" />
                  <p className="mt-2 font-bold text-sm">{product.displayName}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {product.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Bottom summary */}
      <div className="text-center text-sm text-muted-foreground">
        {selectedCount > 0 ? (
          <span>
            {selectedCount} {selectedCount === 1 ? "product" : "products"}{" "}
            selected
          </span>
        ) : (
          <span>
            0 products selected — please select at least 1 to continue
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductSelectionStep;
