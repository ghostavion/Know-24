import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { logPlatformEvent, extractRequestMeta } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import type { ApiResponse } from "@/types/api";

const createBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required").max(100),
  niche: z.string().min(1, "Niche is required").max(200),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  niche: string;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<BusinessData>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();
    const parsed = createBusinessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { name, niche } = parsed.data;
    const slug = slugify(name);
    const supabase = createServiceClient();

    // Find organization for this user
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    let organizationId: string;

    if (membership?.organization_id) {
      organizationId = membership.organization_id;
    } else {
      // Create an organization for the user
      const orgId = crypto.randomUUID();
      const { error: orgError } = await supabase.from("organizations").insert({
        id: orgId,
        name: `${name} Org`,
      });

      if (orgError) {
        return NextResponse.json(
          { error: { code: "ORG_CREATE_FAILED", message: "Failed to create organization" } },
          { status: 500 }
        );
      }

      // Add user as member
      await supabase.from("organization_members").insert({
        organization_id: orgId,
        user_id: userId,
        role: "owner",
      });

      organizationId = orgId;
    }

    const businessId = crypto.randomUUID();

    const { error: businessError } = await supabase.from("businesses").insert({
      id: businessId,
      organization_id: organizationId,
      owner_id: userId,
      name,
      slug,
      niche,
      status: "setup",
      onboarding_step: 1,
    });

    if (businessError) {
      return NextResponse.json(
        { error: { code: "BUSINESS_CREATE_FAILED", message: "Failed to create business" } },
        { status: 500 }
      );
    }

    // Create storefront
    const { error: storefrontError } = await supabase.from("storefronts").insert({
      id: crypto.randomUUID(),
      business_id: businessId,
      subdomain: slug,
    });

    if (storefrontError) {
      return NextResponse.json(
        { error: { code: "STOREFRONT_CREATE_FAILED", message: "Failed to create storefront" } },
        { status: 500 }
      );
    }

    const meta = extractRequestMeta(req);
    logPlatformEvent({
      event_category: "USER_ACTION",
      event_type: "setup.business.created",
      clerk_user_id: userId,
      status: "success",
      business_id: businessId,
      organization_id: organizationId,
      payload: { name, slug, niche },
      ...meta,
    });

    logActivity({
      business_id: businessId,
      event_type: "business_created",
      title: `Business "${name}" created`,
      description: `New business created in the ${niche} niche`,
      metadata: { slug, niche, organization_id: organizationId },
    });

    return NextResponse.json({
      data: { id: businessId, name, slug, niche },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
