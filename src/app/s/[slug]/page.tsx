import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

import { createServiceClient } from "@/lib/supabase/server"
import { StorefrontHero } from "@/components/storefront/StorefrontHero"
import { ProductGrid } from "@/components/storefront/ProductGrid"
import { AboutSection } from "@/components/storefront/AboutSection"
import { EmailCaptureForm } from "@/components/storefront/EmailCaptureForm"
import type { StorefrontData, StorefrontProduct, StorefrontBlogPost } from "@/types/storefront"

interface StorefrontPageProps {
  params: Promise<{ slug: string }>
}

async function getStorefrontData(slug: string): Promise<StorefrontData | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("storefronts")
    .select(
      `
      id,
      business_id,
      subdomain,
      color_palette,
      primary_color,
      secondary_color,
      accent_color,
      font_family,
      logo_url,
      hero_title,
      hero_tagline,
      hero_credibility,
      hero_cta_primary,
      hero_cta_secondary,
      about_title,
      about_body,
      about_photo_url,
      lead_magnet_product_id,
      lead_magnet_headline,
      social_links,
      meta_title,
      meta_description,
      is_published,
      businesses!inner ( id, name )
    `
    )
    .eq("subdomain", slug)
    .eq("is_published", true)
    .single()

  if (error || !data) return null

  const biz = data.businesses as unknown as { id: string; name: string }

  return {
    id: data.id,
    businessId: biz.id,
    businessName: biz.name,
    subdomain: data.subdomain,
    colorPalette: data.color_palette,
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    accentColor: data.accent_color,
    fontFamily: data.font_family,
    logoUrl: data.logo_url,
    heroTitle: data.hero_title,
    heroTagline: data.hero_tagline,
    heroCredibility: data.hero_credibility,
    heroCtaPrimary: data.hero_cta_primary,
    heroCtaSecondary: data.hero_cta_secondary,
    aboutTitle: data.about_title,
    aboutBody: data.about_body,
    aboutPhotoUrl: data.about_photo_url,
    leadMagnetProductId: data.lead_magnet_product_id,
    leadMagnetHeadline: data.lead_magnet_headline,
    socialLinks: (data.social_links ?? {}) as Record<string, string>,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description,
    isPublished: data.is_published,
  }
}

async function getProducts(businessId: string): Promise<StorefrontProduct[]> {
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
      sort_order,
      product_types!inner ( slug, display_name, icon_name )
    `
    )
    .eq("business_id", businessId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })

  if (error || !data) return []

  return data.map((p) => {
    const pt = p.product_types as unknown as { slug: string; display_name: string; icon_name: string }
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      tagline: p.tagline,
      description: p.description,
      coverImageUrl: p.cover_image_url,
      previewContent: p.preview_content,
      pricingModel: p.pricing_model,
      priceCents: p.price_cents,
      comparePriceCents: p.compare_price_cents,
      isLeadMagnet: p.is_lead_magnet,
      isFeatured: p.is_featured,
      productType: {
        slug: pt.slug,
        displayName: pt.display_name,
        iconName: pt.icon_name,
      },
    }
  })
}

async function getBlogPosts(businessId: string): Promise<StorefrontBlogPost[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      body,
      cover_image_url,
      author_name,
      published_at,
      view_count
    `
    )
    .eq("business_id", businessId)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(3)

  if (error || !data) return []

  return data.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    coverImageUrl: post.cover_image_url,
    authorName: post.author_name,
    publishedAt: post.published_at,
    viewCount: post.view_count,
  }))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params
  const storefront = await getStorefrontData(slug)

  if (!storefront) {
    notFound()
  }

  const [products, blogPosts] = await Promise.all([
    getProducts(storefront.businessId),
    getBlogPosts(storefront.businessId),
  ])

  return (
    <>
      {/* Hero */}
      <StorefrontHero
        title={storefront.heroTitle}
        tagline={storefront.heroTagline}
        credibility={storefront.heroCredibility}
        ctaPrimary={storefront.heroCtaPrimary}
        ctaSecondary={storefront.heroCtaSecondary}
        accentColor={storefront.accentColor}
      />

      {/* Products */}
      <ProductGrid products={products} subdomain={storefront.subdomain} />

      {/* About */}
      <AboutSection
        title={storefront.aboutTitle}
        body={storefront.aboutBody}
        photoUrl={storefront.aboutPhotoUrl}
      />

      {/* Email Capture */}
      {storefront.leadMagnetHeadline && (
        <EmailCaptureForm
          headline={storefront.leadMagnetHeadline}
          storefrontSlug={storefront.subdomain}
          businessName={storefront.businessName}
        />
      )}

      {/* Recent Blog Posts */}
      {blogPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Latest Posts
            </h2>
            <Link
              href={`/s/${storefront.subdomain}/blog`}
              className="text-sm font-medium text-[var(--sf-accent)] transition-colors hover:opacity-80"
            >
              View all posts
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/s/${storefront.subdomain}/blog/${post.slug}`}
                className="group block overflow-hidden rounded-xl border border-border bg-background transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              >
                {/* Cover Image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  {post.coverImageUrl ? (
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--sf-primary)]/20 to-[var(--sf-accent)]/20">
                      <span className="text-3xl font-bold text-foreground/10">
                        {post.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(post.publishedAt)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-foreground line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
