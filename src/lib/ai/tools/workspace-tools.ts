import { tool } from "ai";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { STOREFRONT_PALETTES } from "@/lib/constants/product-types";
import { getProductGenerationQueue } from "@/lib/queue/queues";

export function getWorkspaceTools(businessId: string) {
  return {
    getBusinessStats: tool({
      description:
        "Get business analytics and stats for a specific time period",
      inputSchema: z.object({
        period: z
          .enum(["today", "this_week", "this_month", "last_30_days", "all_time"])
          .default("this_month"),
      }),
      execute: async ({ period }) => {
        return {
          revenue: 1250.0,
          orders: 23,
          subscribers: 156,
          period,
        };
      },
    }),

    updateProductPrice: tool({
      description: "Update the price of a product",
      inputSchema: z.object({
        productName: z
          .string()
          .describe("Name or partial name of the product"),
        newPriceCents: z
          .number()
          .int()
          .positive()
          .describe("New price in cents (e.g., 5700 for $57)"),
      }),
      execute: async ({ productName, newPriceCents }) => {
        const supabase = createServiceClient();

        const { data: product, error: findError } = await supabase
          .from("products")
          .select("id, title, price_cents")
          .eq("business_id", businessId)
          .ilike("title", `%${productName}%`)
          .limit(1)
          .single();

        if (findError || !product) {
          return {
            success: false as const,
            error: `Product not found matching "${productName}"`,
          };
        }

        const oldPriceCents = product.price_cents as number;

        const { error: updateError } = await supabase
          .from("products")
          .update({
            price_cents: newPriceCents,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (updateError) {
          return { success: false as const, error: updateError.message };
        }

        return {
          success: true as const,
          productId: product.id as string,
          title: product.title as string,
          oldPrice: oldPriceCents,
          newPrice: newPriceCents,
        };
      },
    }),

    updateProductStatus: tool({
      description:
        "Change the status of a product (activate, deactivate, or archive)",
      inputSchema: z.object({
        productName: z.string(),
        status: z.enum(["active", "draft", "archived"]),
      }),
      execute: async ({ productName, status }) => {
        const supabase = createServiceClient();

        const { data: product, error: findError } = await supabase
          .from("products")
          .select("id, title, status")
          .eq("business_id", businessId)
          .ilike("title", `%${productName}%`)
          .limit(1)
          .single();

        if (findError || !product) {
          return {
            success: false as const,
            error: `Product not found matching "${productName}"`,
          };
        }

        const oldStatus = product.status as string;

        const { error: updateError } = await supabase
          .from("products")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (updateError) {
          return { success: false as const, error: updateError.message };
        }

        return {
          success: true as const,
          productId: product.id as string,
          title: product.title as string,
          oldStatus,
          newStatus: status,
        };
      },
    }),

    listProducts: tool({
      description:
        "List all products for this business with their current status and pricing",
      inputSchema: z.object({}),
      execute: async () => {
        const supabase = createServiceClient();

        const { data: products, error } = await supabase
          .from("products")
          .select("id, title, status, price_cents, pricing_model")
          .eq("business_id", businessId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (error) {
          return { products: [] as Array<{ id: string; title: string; status: string; priceCents: number; pricingModel: string }> };
        }

        return {
          products: (products ?? []).map((p) => ({
            id: p.id as string,
            title: p.title as string,
            status: p.status as string,
            priceCents: p.price_cents as number,
            pricingModel: p.pricing_model as string,
          })),
        };
      },
    }),

    updateStorefrontPalette: tool({
      description: "Change the storefront color palette",
      inputSchema: z.object({
        palette: z
          .enum(["A", "B", "C", "D"])
          .describe(
            "A=Ocean Professional, B=Forest Authority, C=Purple Expertise, D=Slate Modern"
          ),
      }),
      execute: async ({ palette }) => {
        const supabase = createServiceClient();

        const selectedPalette = STOREFRONT_PALETTES.find(
          (p) => p.id === palette
        );

        if (!selectedPalette) {
          throw new Error(`Invalid palette: ${palette}`);
        }

        const { error } = await supabase
          .from("storefronts")
          .update({
            color_palette: palette,
            primary_color: selectedPalette.headerColor,
            accent_color: selectedPalette.accentColor,
            updated_at: new Date().toISOString(),
          })
          .eq("business_id", businessId);

        if (error) {
          throw new Error(error.message);
        }

        return {
          success: true as const,
          palette: selectedPalette.name,
          primaryColor: selectedPalette.headerColor,
          accentColor: selectedPalette.accentColor,
        };
      },
    }),

    generateNewProduct: tool({
      description: "Queue a new product for AI generation",
      inputSchema: z.object({
        productType: z.enum([
          "guide_ebook",
          "framework_template_pack",
          "cheat_sheet",
          "email_course",
          "assessment_quiz",
          "prompt_pack",
          "swipe_file",
          "resource_directory",
          "worksheet_workbook",
          "mini_course",
          "chatbot",
          "expert_engine",
        ]),
        title: z.string().optional(),
      }),
      execute: async ({ productType, title }) => {
        const supabase = createServiceClient();

        const { data: typeRecord, error: typeError } = await supabase
          .from("product_types")
          .select("id")
          .eq("slug", productType)
          .single();

        if (typeError || !typeRecord) {
          return {
            success: false as const,
            error: `Product type "${productType}" not found in database`,
          };
        }

        const { data: product, error: insertError } = await supabase
          .from("products")
          .insert({
            business_id: businessId,
            product_type_id: typeRecord.id,
            title: title ?? `New ${productType.replace(/_/g, " ")}`,
            status: "generating",
          })
          .select("id")
          .single();

        if (insertError || !product) {
          return {
            success: false as const,
            error: insertError?.message ?? "Failed to create product record",
          };
        }

        await getProductGenerationQueue().add("generate", {
          productId: product.id,
          businessId,
          productType,
        });

        return {
          success: true as const,
          productId: product.id as string,
          message: "Product generation started",
        };
      },
    }),
  };
}
