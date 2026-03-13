import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

import { createServiceClient } from "@/lib/supabase/server"
import { AIDisclosure } from "@/components/compliance/AIDisclosure"
import type { StorefrontBlogPost } from "@/types/storefront"
import type { Metadata } from "next"

interface BlogPostPageProps {
  params: Promise<{ slug: string; postSlug: string }>
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

async function getBlogPost(
  businessId: string,
  postSlug: string
): Promise<StorefrontBlogPost | null> {
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
      view_count,
      meta_title,
      meta_description
    `
    )
    .eq("business_id", businessId)
    .eq("slug", postSlug)
    .eq("status", "published")
    .is("deleted_at", null)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    body: data.body,
    coverImageUrl: data.cover_image_url,
    authorName: data.author_name,
    publishedAt: data.published_at,
    viewCount: data.view_count,
  }
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
  params: Promise<{ slug: string; postSlug: string }>
}): Promise<Metadata> {
  const { slug, postSlug } = await params
  const businessId = await getStorefrontBusinessId(slug)

  if (!businessId) {
    return { title: "Post Not Found" }
  }

  const supabase = createServiceClient()

  const { data } = await supabase
    .from("blog_posts")
    .select("title, excerpt, meta_title, meta_description, cover_image_url")
    .eq("business_id", businessId)
    .eq("slug", postSlug)
    .eq("status", "published")
    .is("deleted_at", null)
    .single()

  if (!data) {
    return { title: "Post Not Found" }
  }

  return {
    title: data.meta_title ?? data.title,
    description:
      data.meta_description ?? data.excerpt ?? data.title,
    openGraph: {
      title: data.meta_title ?? data.title,
      description:
        data.meta_description ?? data.excerpt ?? data.title,
      type: "article",
      ...(data.cover_image_url && {
        images: [{ url: data.cover_image_url }],
      }),
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug, postSlug } = await params
  const businessId = await getStorefrontBusinessId(slug)

  if (!businessId) {
    notFound()
  }

  const post = await getBlogPost(businessId, postSlug)

  if (!post) {
    notFound()
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      {/* Back link */}
      <Link
        href={`/s/${slug}/blog`}
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
        Back to blog
      </Link>

      {/* Cover Image */}
      {post.coverImageUrl && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* Header */}
      <header className="mt-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {post.title}
        </h1>

        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          {post.authorName && (
            <>
              <span className="font-medium text-foreground">
                {post.authorName}
              </span>
              <span aria-hidden="true">&middot;</span>
            </>
          )}
          <time dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
        </div>

        <AIDisclosure className="mt-3" />
      </header>

      {/* Body */}
      <div className="prose prose-lg mt-10 max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-[var(--sf-accent)] prose-strong:text-foreground prose-blockquote:border-[var(--sf-accent)] prose-blockquote:text-muted-foreground">
        {post.body.split("\n").map((paragraph, i) => {
          if (!paragraph.trim()) return null
          return <p key={i}>{paragraph}</p>
        })}
      </div>

      {/* Footer navigation */}
      <div className="mt-16 border-t border-border pt-8">
        <Link
          href={`/s/${slug}/blog`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sf-accent)] transition-colors hover:opacity-80"
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
          View all posts
        </Link>
      </div>
    </article>
  )
}
