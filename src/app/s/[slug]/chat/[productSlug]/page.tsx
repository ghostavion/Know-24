import Link from "next/link"
import { notFound } from "next/navigation"

import { createServiceClient } from "@/lib/supabase/server"
import { ChatInterface } from "@/components/chatbot/ChatInterface"
import type { Metadata } from "next"

interface ChatPageProps {
  params: Promise<{ slug: string; productSlug: string }>
}

async function getStorefront(slug: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("storefronts")
    .select(
      `
      id,
      business_id,
      subdomain,
      accent_color,
      is_published,
      businesses!inner ( name )
    `
    )
    .eq("subdomain", slug)
    .eq("is_published", true)
    .single()

  if (error || !data) return null

  return data
}

async function getChatbotProduct(businessId: string, productSlug: string) {
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
      chatbot_personality,
      product_types!inner ( slug )
    `
    )
    .eq("business_id", businessId)
    .eq("slug", productSlug)
    .eq("status", "active")
    .is("deleted_at", null)
    .single()

  if (error || !data) return null

  const productType = data.product_types as unknown as { slug: string }

  if (productType.slug !== "chatbot") return null

  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}): Promise<Metadata> {
  const { slug, productSlug } = await params
  const storefront = await getStorefront(slug)

  if (!storefront) {
    return { title: "Not Found" }
  }

  const product = await getChatbotProduct(storefront.business_id, productSlug)

  if (!product) {
    return { title: "Not Found" }
  }

  const businessName = (storefront.businesses as unknown as { name: string })
    .name

  return {
    title: `${product.title} | ${businessName}`,
    description:
      product.tagline ??
      product.description?.slice(0, 160) ??
      `Chat with ${businessName}'s AI assistant`,
    openGraph: {
      title: `${product.title} | ${businessName}`,
      description:
        product.tagline ??
        product.description?.slice(0, 160) ??
        `Chat with ${businessName}'s AI assistant`,
    },
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { slug, productSlug } = await params
  const storefront = await getStorefront(slug)

  if (!storefront) {
    notFound()
  }

  const product = await getChatbotProduct(storefront.business_id, productSlug)

  if (!product) {
    notFound()
  }

  const businessName = (storefront.businesses as unknown as { name: string })
    .name

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top bar */}
      <div className="border-b px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {product.title}
            </h1>
            {product.tagline && (
              <p className="text-sm text-muted-foreground">
                {product.tagline}
              </p>
            )}
          </div>

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
        </div>
      </div>

      {/* Chat interface (fills remaining height) */}
      <div className="mx-auto w-full max-w-4xl flex-1 overflow-hidden">
        <ChatInterface
          businessId={storefront.business_id}
          productId={product.id}
          productTitle={product.title}
          personality={product.chatbot_personality as string | null}
          accentColor={storefront.accent_color ?? "#7C3AED"}
        />
      </div>
    </div>
  )
}
