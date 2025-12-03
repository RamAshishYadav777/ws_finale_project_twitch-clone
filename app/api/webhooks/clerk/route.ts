import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";
import { resetIngresses } from "@/actions/ingress";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET in .env or .env.local");
  }

  // ✅ Read Svix headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  // ✅ Read body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const eventType = evt.type;

  try {
    /* ===========================
       ✅ USER CREATED
    =========================== */
    if (eventType === "user.created") {
      const userId = payload.data.id;

      const username =
        payload.data.username ||
        payload.data.email_addresses?.[0]?.email_address?.split("@")[0];

      const imageUrl = payload.data.image_url || "";

      // ✅ Prevent duplicate users
      const existingUser = await prisma.user.findUnique({
        where: { externalUserId: userId },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            externalUserId: userId,
            username,
            imageUrl,
            stream: {
              create: {
                name: `${username}'s stream`,
              },
            },
          },
        });
      }
    }

    /* ===========================
       ✅ USER UPDATED
    =========================== */
    if (eventType === "user.updated") {
      const userId = payload.data.id;

      const username =
        payload.data.username ||
        payload.data.email_addresses?.[0]?.email_address?.split("@")[0];

      const imageUrl = payload.data.image_url || "";

      await prisma.user.update({
        where: {
          externalUserId: userId,
        },
        data: {
          username,
          imageUrl,
        },
      });
    }

    /* ===========================
       ✅ USER DELETED
    =========================== */
    if (eventType === "user.deleted") {
      const userId = payload.data.id;

      // ✅ Find internal user first
      const user = await prisma.user.findUnique({
        where: {
          externalUserId: userId,
        },
      });

      if (user) {
        // ✅ Reset ingress using INTERNAL ID
        await resetIngresses(user.id);

        await prisma.user.delete({
          where: {
            id: user.id,
          },
        });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Clerk webhook DB error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
