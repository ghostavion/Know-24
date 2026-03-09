import type { StorefrontProduct } from "@/types/storefront"

import { ProductCard } from "./ProductCard"

interface ProductGridProps {
  products: StorefrontProduct[]
  subdomain: string
}

const ProductGrid = ({ products, subdomain }: ProductGridProps) => {
  return (
    <section id="products" className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="text-2xl font-bold text-foreground md:text-3xl">
        Products
      </h2>

      {products.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Products coming soon
          </p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Check back later for new offerings.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              subdomain={subdomain}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export { ProductGrid }
export type { ProductGridProps }
