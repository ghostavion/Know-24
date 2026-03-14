import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServiceClient } from "@/lib/supabase/server";
import { logPlatformEvent } from "@/lib/logging/platform-logger";

interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: { code: "MISSING_HEADERS", message: "Missing svix headers" } },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_SIGNATURE", message: "Invalid webhook signature" } },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const {
        id,
        email_addresses,
        first_name,
        last_name,
        image_url,
      } = evt.data as {
        id: string;
        email_addresses: Array<{ email_address: string }>;
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
      };

      const primaryEmail = email_addresses?.[0]?.email_address;

      await supabase.from("users").upsert(
        {
          clerk_user_id: id,
          email: primaryEmail,
          first_name: first_name ?? null,
          last_name: last_name ?? null,
          avatar_url: image_url ?? null,
        },
        { onConflict: "clerk_user_id" }
      );

      // Ensure a user_profiles row exists so billing/profile endpoints always find one
      if (evt.type === "user.created") {
        await supabase.from("user_profiles").upsert(
          {
            user_id: id,
            display_name: [first_name, last_name].filter(Boolean).join(" ") || null,
          },
          { onConflict: "user_id" }
        );
      }

      logPlatformEvent({
        event_category: "AUTH",
        event_type: evt.type as "user.created" | "user.updated",
        clerk_user_id: id,
        status: "success",
        payload: { email: primaryEmail, provider: "clerk" },
      });
      break;
    }

    case "user.deleted": {
      const { id } = evt.data as { id: string };
      await supabase
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .eq("clerk_user_id", id);

      logPlatformEvent({
        event_category: "AUTH",
        event_type: "user.deleted",
        clerk_user_id: id,
        status: "success",
        payload: { provider: "clerk" },
      });
      break;
    }
  }

  return NextResponse.json({ data: { received: true } });
}
