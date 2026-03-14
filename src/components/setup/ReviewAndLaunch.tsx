"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Headphones,
  Video,
  Globe,
  Compass,
  Image,
  Check,
  Loader2,
  AlertCircle,
  PartyPopper,
  Copy,
  ExternalLink,
  Mail,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSetupWizard } from "@/hooks/useSetupWizard";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ProductData {
  id: string;
  title: string;
  description: string;
  price: number;
  productTypeSlug: string;
}

interface AssetStatus {
  coverImage: boolean;
  audio: boolean;
  video: boolean;
  storefront: boolean;
  pdf: boolean;
}

interface ResearchSummary {
  recommendedProduct?: ProductData;
  scoutOpportunities?: number;
  niche?: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

const ReviewAndLaunch = () => {
  const {
    businessId,
    businessName,
    businessSlug,
    niche,
    selectedPalette,
    setSelectedPalette,
    reset,
  } = useSetupWizard();

  const router = useRouter();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [assets, setAssets] = useState<AssetStatus>({
    coverImage: false,
    audio: false,
    video: false,
    storefront: false,
    pdf: false,
  });
  const [scoutCount, setScoutCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [storefrontUrl, setStorefrontUrl] = useState("");
  const [copied, setCopied] = useState(false);

  /* -- Fetch product + asset data on mount -------------------------------- */

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        // Fetch research data for product details
        const researchRes = await fetch(`/api/research/${businessId}`);
        if (researchRes.ok) {
          const researchData: ResearchSummary = await researchRes.json();
          if (researchData.recommendedProduct) {
            setProduct(researchData.recommendedProduct);
          }
          if (researchData.scoutOpportunities) {
            setScoutCount(researchData.scoutOpportunities);
          }
        }

        // Fetch asset status
        const productsRes = await fetch(`/api/businesses/${businessId}/products`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          const firstProduct = productsData.data?.[0] ?? productsData[0];

          if (firstProduct?.id) {
            if (!product) {
              setProduct({
                id: firstProduct.id,
                title: firstProduct.title ?? "Your Product",
                description: firstProduct.description ?? "",
                price: firstProduct.price ?? 0,
                productTypeSlug: firstProduct.productTypeSlug ?? "ebook",
              });
            }

            const assetsRes = await fetch(
              `/api/products/${firstProduct.id}/assets`
            );
            if (assetsRes.ok) {
              const assetsData = await assetsRes.json();
              setAssets({
                coverImage: !!assetsData.coverImage,
                audio: !!assetsData.audio,
                video: !!assetsData.video,
                storefront: !!assetsData.storefront,
                pdf: !!assetsData.pdf,
              });
            }
          }
        }
      } catch {
        // Non-critical — page still renders with defaults
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* -- Handlers ----------------------------------------------------------- */

  const handleGoLive = async () => {
    setPublishing(true);
    setError("");

    try {
      const res = await fetch("/api/setup/golive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, palette: selectedPalette }),
      });

      const json = await res.json();

      if (res.ok && json.data) {
        setSuccess(true);
        setStorefrontUrl(
          json.data.storefrontUrl ?? `https://${businessSlug}.agenttv.io`
        );
      } else {
        setError(json.error?.message ?? "Failed to publish storefront");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  };

  const handleGoToDashboard = () => {
    reset();
    router.push("/dashboard");
  };

  /* -- Loading state ------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* -- Success / celebration state ---------------------------------------- */

  if (success) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        {/* Confetti icon */}
        <div className="relative">
          <PartyPopper className="h-16 w-16 text-[#7C3AED]" />
          <div className="absolute -right-2 -top-2 h-4 w-4 animate-ping rounded-full bg-[#7C3AED]/40" />
          <div className="absolute -bottom-1 -left-3 h-3 w-3 animate-ping rounded-full bg-[#7C3AED]/30 delay-300" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold">You&apos;re Live!</h2>
          <p className="mt-2 text-muted-foreground">
            Your storefront is published and ready for customers.
          </p>
        </div>

        {/* Storefront URL */}
        {storefrontUrl && (
          <div className="flex items-center gap-2 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5">
            <Globe className="h-4 w-4 text-[#7C3AED]" />
            <span className="text-sm font-medium text-[#7C3AED]">
              {storefrontUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="ml-1 rounded p-1 transition-colors hover:bg-[#7C3AED]/10"
              title="Copy URL"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-[#7C3AED]" />
              )}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCopyUrl}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Share Your Store"}
          </Button>
          <Button onClick={handleGoToDashboard} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  /* -- Main review UI ----------------------------------------------------- */

  const formatPrice = (cents: number) => {
    if (!cents) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatBadges: Array<{ label: string; icon: typeof FileText; active: boolean }> = [
    { label: "PDF", icon: FileText, active: assets.pdf },
    { label: "Audio", icon: Headphones, active: assets.audio },
    { label: "Video", icon: Video, active: assets.video },
    { label: "Cover Art", icon: Image, active: assets.coverImage },
  ];

  return (
    <div className="space-y-8">
      {/* Section 1: Product Summary */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Your Product</h3>

        <div className="space-y-3">
          <div>
            <h4 className="text-base font-bold text-foreground">
              {product?.title ?? "Your Digital Product"}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {product?.description ?? "AI-generated content tailored to your niche."}
            </p>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#7C3AED]">
              {formatPrice(product?.price ?? 0)}
            </span>
          </div>

          {/* Format badges */}
          <div className="flex flex-wrap gap-2">
            {formatBadges.map((badge) => {
              const BadgeIcon = badge.icon;
              return (
                <span
                  key={badge.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                    badge.active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                  )}
                >
                  <BadgeIcon className="h-3 w-3" />
                  {badge.label}
                  {badge.active && <Check className="h-3 w-3" />}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2: Storefront Preview */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Storefront Preview</h3>
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          {/* Browser Chrome Bar */}
          <div className="flex items-center gap-1.5 rounded-t-xl bg-gray-100 px-4 py-2.5 dark:bg-gray-800">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 dark:bg-gray-700">
              <span className="text-xs text-gray-400">
                {businessSlug || "your-business"}.agenttv.io
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-center bg-[#1e293b] py-10">
            <h4 className="text-xl font-bold text-white">
              {businessName || "Your Business"}
            </h4>
          </div>

          {/* Content area with product card */}
          <div className="flex items-center justify-center bg-white py-10 dark:bg-gray-950">
            <div className="w-64 rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#7C3AED]/10">
                <FileText className="h-6 w-6 text-[#7C3AED]" />
              </div>
              <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {product?.title ?? "Your Product"}
              </h5>
              <p className="mt-1 text-lg font-bold text-[#7C3AED]">
                {formatPrice(product?.price ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Distribution Opportunities */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7C3AED]/10">
            <Compass className="h-5 w-5 text-[#7C3AED]" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Distribution Opportunities</h3>
            <p className="text-sm text-muted-foreground">
              {scoutCount > 0
                ? `Scout found ${scoutCount} distribution ${scoutCount === 1 ? "opportunity" : "opportunities"} for your product.`
                : "Distribution channels are being prepared for your launch."}
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Bonus Content */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Bonus Content</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <BonusCard
            icon={BookOpen}
            title="Blog Post Draft"
            description="SEO-optimized article ready to publish"
          />
          <BonusCard
            icon={Mail}
            title="Email Sequence"
            description="5-email nurture sequence loaded"
          />
          <BonusCard
            icon={Video}
            title="Explainer Video"
            description="90-second product overview"
          />
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Section 5: Go Live */}
      <section className="space-y-4 rounded-xl border border-[#7C3AED]/20 bg-gradient-to-b from-[#7C3AED]/5 to-transparent p-6 text-center">
        <h3 className="text-lg font-semibold">Ready to Launch</h3>
        <p className="text-sm text-muted-foreground">
          Everything looks great! Your storefront will be live at{" "}
          <span className="font-medium text-foreground">
            {businessSlug || "your-business"}.agenttv.io
          </span>
        </p>
        <Button
          onClick={handleGoLive}
          disabled={publishing}
          size="lg"
          className="gap-2 bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90"
        >
          {publishing && <Loader2 className="h-4 w-4 animate-spin" />}
          {publishing ? "Publishing..." : "Go Live"}
        </Button>
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Bonus Card sub-component                                                  */
/* -------------------------------------------------------------------------- */

interface BonusCardProps {
  icon: typeof FileText;
  title: string;
  description: string;
}

const BonusCard = ({ icon: Icon, title, description }: BonusCardProps) => (
  <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#7C3AED]/10">
      <Icon className="h-4 w-4 text-[#7C3AED]" />
    </div>
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default ReviewAndLaunch;
