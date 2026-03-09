import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

import { createServiceClient } from "@/lib/supabase/server"
import type { StorefrontBlogPost } from "@/types/storefront"
import type { Metadata } from "next"

interface BlogIndexPageProps {
  params: Promise<{ slug: string }>
}

async function getStorefrontInfo(slug: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("storefronts")
    .select(
      `
      business_id,
      subdomain,
      businesses!inner ( name )
    `
    )
    .eq("subdomain", slug)
    .eq("is_published", true)
    .single()

  if (error || !data) return null
  return data
}

async function getBlogPosts(
  businessId: string
): Promise<StorefrontBlogPost[]> {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const storefront = await getStorefrontInfo(slug)

  if (!storefront) {
    return { title: "Blog Not Found" }
  }

  const businessName = (storefront.businesses as unknown as { name: string }).name

  return {
    title: `Blog | ${businessName}`,
    description: `Read the latest posts from ${businessName}.`,
  }
}

export default async function BlogIndexPage({ params }: BlogIndexPageProps) {
  const { slug } = await params
  const storefront = await getStorefrontInfo(slug)

  if (!storefront) {
    notFound()
  }

  const businessName = (storefront.businesses as unknown as { name: string }).name
  const posts = await getBlogPosts(storefront.business_id)

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
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

      <h1 className="mt-6 text-3xl font-bold text-foreground md:text-4xl">
        Blog
      </h1>
      <p className="mt-2 text-muted-foreground">
        Latest posts from {businessName}
      </p>

      {posts.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No blog posts yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Check back later for new content.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/s/${slug}/blog/${post.slug}`}
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                  {post.authorName && (
                    <>
                      <span aria-hidden="true">&middot;</span>
                      <span>{post.authorName}</span>
                    </>
                  )}
                </div>
                <h2 className="mt-2 text-base font-semibold text-foreground line-clamp-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-3 inline-block text-sm font-medium text-[var(--sf-accent)]">
                  Read more
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
