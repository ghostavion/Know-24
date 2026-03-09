// Storefront data returned by public API
export interface StorefrontData {
  id: string;
  businessId: string;
  businessName: string;
  subdomain: string;
  colorPalette: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
  heroTitle: string | null;
  heroTagline: string | null;
  heroCredibility: string | null;
  heroCtaPrimary: string;
  heroCtaSecondary: string | null;
  aboutTitle: string | null;
  aboutBody: string | null;
  aboutPhotoUrl: string | null;
  leadMagnetProductId: string | null;
  leadMagnetHeadline: string | null;
  socialLinks: Record<string, string>;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
}

// Product displayed on storefront
export interface StorefrontProduct {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  coverImageUrl: string | null;
  previewContent: string | null;
  pricingModel: string;
  priceCents: number | null;
  comparePriceCents: number | null;
  isLeadMagnet: boolean;
  isFeatured: boolean;
  productType: {
    slug: string;
    displayName: string;
    iconName: string;
  };
}

// Blog post displayed on storefront
export interface StorefrontBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  authorName: string | null;
  publishedAt: string;
  viewCount: number;
}

// Checkout session creation
export interface CheckoutRequest {
  productId: string;
  storefrontSlug: string;
  customerEmail: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

// Email subscription
export interface EmailSubscribeRequest {
  email: string;
  firstName?: string;
  storefrontSlug: string;
}

// Stripe Connect
export interface ConnectOnboardingRequest {
  businessId: string;
}

export interface ConnectOnboardingResponse {
  url: string;
}

// Order with product details (for post-purchase)
export interface OrderWithProduct {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  accessGrantedAt: string | null;
  product: {
    id: string;
    title: string;
    slug: string;
    productType: string;
  };
}
