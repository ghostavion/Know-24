import { notFound } from "next/navigation"

import { createServiceClient } from "@/lib/supabase/server"
import { StorefrontNav } from "@/components/storefront/StorefrontNav"
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter"
import type { Metadata } from "next"

interface StorefrontLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
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
      primary_color,
      secondary_color,
      accent_color,
      font_family,
      logo_url,
      hero_title,
      meta_title,
      meta_description,
      social_links,
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const storefront = await getStorefront(slug)

  if (!storefront) {
    return { title: "Storefront Not Found" }
  }

  const businessName = (storefront.businesses as unknown as { name: string }).name

  return {
    title: storefront.meta_title ?? businessName,
    description:
      storefront.meta_description ??
      `${businessName} — Browse products, resources, and more.`,
    openGraph: {
      title: storefront.meta_title ?? businessName,
      description:
        storefront.meta_description ??
        `${businessName} — Browse products, resources, and more.`,
      type: "website",
    },
  }
}

export default async function StorefrontLayout({
  children,
  params,
}: StorefrontLayoutProps) {
  const { slug } = await params
  const storefront = await getStorefront(slug)

  if (!storefront) {
    notFound()
  }

  const businessName = (storefront.businesses as unknown as { name: string }).name
  const socialLinks = (storefront.social_links ?? {}) as Record<string, string>

  return (
    <div
      className="min-h-screen bg-background"
      style={
        {
          "--sf-primary": storefront.primary_color,
          "--sf-accent": storefront.accent_color,
          "--sf-secondary": storefront.secondary_color,
        } as React.CSSProperties
      }
    >
      <StorefrontNav
        businessName={businessName}
        logoUrl={storefront.logo_url}
        subdomain={storefront.subdomain}
      />

      <main>{children}</main>

      <StorefrontFooter
        businessName={businessName}
        socialLinks={socialLinks}
      />
    </div>
  )
}
