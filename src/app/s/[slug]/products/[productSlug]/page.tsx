import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

import { createServiceClient } from "@/lib/supabase/server"
import { CheckoutButton } from "@/components/storefront/CheckoutButton"
import type { StorefrontProduct } from "@/types/storefront"
import type { Metadata } from "next"

interface ProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>
}

const GRADIENT_MAP: Record<string, string> = {
  ebook: "from-blue-500 to-indigo-600",
  course: "from-purple-500 to-pink-600",
  template: "from-emerald-500 to-teal-600",
  guide: "from-amber-500 to-orange-600",
  checklist: "from-cyan-500 to-blue-600",
  newsletter: "from-rose-500 to-red-600",
  coaching: "from-violet-500 to-purple-600",
  default: "from-slate-500 to-gray-600",
}

const formatPrice = (cents: number): string => {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

async function getStorefrontBusinessId(slug: string): Promise<string | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("storefronts")
    .select("business_id")
    .eq("subdomain", slug)
    .eq("is_published", true)
    .single()

  if (error || !data) return null
  return data.business_id
}

async function getProduct(
  businessId: string,
  productSlug: string
): Promise<StorefrontProduct | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      title,
      slug,
      tagline,
      description,
      cover_image_url,
      preview_content,
      pricing_model,
      price_cents,
      compare_price_cents,
      is_lead_magnet,
      is_featured,
      product_types!inner ( slug, display_name, icon_name )
    `
    )
    .eq("business_id", businessId)
    .eq("slug", productSlug)
    .eq("status", "active")
    .is("deleted_at", null)
    .single()

  if (error || !data) return null

  const pt = data.product_types as unknown as {
    slug: string
    display_name: string
    icon_name: string
  }

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    tagline: data.tagline,
    description: data.description,
    coverImageUrl: data.cover_image_url,
    previewContent: data.preview_content,
    pricingModel: data.pricing_model,
    priceCents: data.price_cents,
    comparePriceCents: data.compare_price_cents,
    isLeadMagnet: data.is_lead_magnet,
    isFeatured: data.is_featured,
    productType: {
      slug: pt.slug,
      displayName: pt.display_name,
      iconName: pt.icon_name,
    },
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}): Promise<Metadata> {
  const { slug, productSlug } = await params
  const businessId = await getStorefrontBusinessId(slug)

  if (!businessId) {
    return { title: "Product Not Found" }
  }

  const product = await getProduct(businessId, productSlug)

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: product.title,
    description:
      product.tagline ?? product.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: product.title,
      description:
        product.tagline ?? product.description?.slice(0, 160) ?? undefined,
      ...(product.coverImageUrl && {
        images: [{ url: product.coverImageUrl }],
      }),
    },
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug, productSlug } = await params
  const businessId = await getStorefrontBusinessId(slug)

  if (!businessId) {
    notFound()
  }

  const product = await getProduct(businessId, productSlug)

  if (!product) {
    notFound()
  }

  const isFree =
    product.isLeadMagnet ||
    product.pricingModel === "free" ||
    product.priceCents === 0

  const gradientClass =
    GRADIENT_MAP[product.productType.slug] ?? GRADIENT_MAP.default

  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      {/* Back link */}
      <Link
        href={`/s/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Back to storefront
      </Link>

      {/* Cover Image */}
      <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl">
        {product.coverImageUrl ? (
          <Image
            src={product.coverImageUrl}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
            priority
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientClass}`}
          >
            <span className="text-6xl font-bold text-white/20">
              {product.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Product Type Badge */}
      <div className="mt-6">
        <span className="inline-block rounded-full bg-[var(--sf-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--sf-primary)]">
          {product.productType.displayName}
        </span>
      </div>

      {/* Title & Tagline */}
      <h1 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">
        {product.title}
      </h1>

      {product.tagline && (
        <p className="mt-3 text-lg text-muted-foreground">{product.tagline}</p>
      )}

      {/* Price */}
      <div className="mt-6 flex items-center gap-3">
        {isFree ? (
          <span className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Free
          </span>
        ) : (
          <>
            {product.priceCents !== null && (
              <span className="text-3xl font-bold text-foreground">
                {formatPrice(product.priceCents)}
              </span>
            )}
            {product.comparePriceCents !== null &&
              product.comparePriceCents > 0 && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.comparePriceCents)}
                </span>
              )}
          </>
        )}
      </div>

      {/* Checkout Button */}
      <div className="mt-8 max-w-sm">
        <CheckoutButton
          productId={product.id}
          storefrontSlug={slug}
          priceCents={product.priceCents}
          pricingModel={product.pricingModel}
          isLeadMagnet={product.isLeadMagnet}
        />
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground">
            About this product
          </h2>
          <div className="prose prose-lg mt-4 max-w-none text-muted-foreground">
            {product.description.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Preview Content */}
      {product.previewContent && (
        <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            Preview
          </h2>
          <div className="prose prose-lg mt-4 max-w-none text-muted-foreground">
            {product.previewContent.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
