import Link from "next/link"
import Image from "next/image"

import { cn } from "@/lib/utils"
import type { StorefrontProduct } from "@/types/storefront"

interface ProductCardProps {
  product: StorefrontProduct
  subdomain: string
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

const ProductCard = ({ product, subdomain }: ProductCardProps) => {
  const gradientClass = GRADIENT_MAP[product.productType.slug] ?? GRADIENT_MAP.default
  const isFree = product.isLeadMagnet || product.pricingModel === "free" || product.priceCents === 0

  return (
    <Link
      href={`/s/${subdomain}/products/${product.slug}`}
      className={cn(
        "group block overflow-hidden rounded-xl border border-border bg-background",
        "transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      )}
    >
      {/* Cover Image or Gradient Placeholder */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {product.coverImageUrl ? (
          <Image
            src={product.coverImageUrl}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br",
              gradientClass
            )}
          >
            <span className="text-3xl font-bold text-white/30">
              {product.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Product Type Badge */}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {product.productType.displayName}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-foreground line-clamp-2">
          {product.title}
        </h3>

        {product.tagline && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {product.tagline}
          </p>
        )}

        {/* Price */}
        <div className="mt-3 flex items-center gap-2">
          {isFree ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Free
            </span>
          ) : (
            <>
              {product.priceCents !== null && (
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(product.priceCents)}
                </span>
              )}
              {product.comparePriceCents !== null && product.comparePriceCents > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.comparePriceCents)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

export { ProductCard }
export type { ProductCardProps }
