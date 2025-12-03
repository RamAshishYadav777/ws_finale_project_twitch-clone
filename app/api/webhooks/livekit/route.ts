import { headers } from "next/headers";
import { WebhookReceiver } from "livekit-server-sdk";

import { prisma } from "@/lib/db";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headerPayload = headers();
    const authorization = headerPayload.get("Authorization");

    if (!authorization) {
      return new Response("Missing Authorization header", { status: 400 });
    }

    // ✅ Verify LiveKit signature
    const event = receiver.receive(body, authorization);

    const ingressId = event.ingressInfo?.ingressId;

    if (!ingressId) {
      return new Response("Missing ingressId", { status: 400 });
    }

    /* ===========================
       ✅ STREAM STARTED
    =========================== */
    if (event.event === "ingress_started") {
      await prisma.stream.update({
        where: {
          ingressId,
        },
        data: {
          isLive: true,
        },
      });
    }

    /* ===========================
       ✅ STREAM ENDED
    =========================== */
    if (event.event === "ingress_ended") {
      await prisma.stream.update({
        where: {
          ingressId,
        },
        data: {
          isLive: false,
        },
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ LiveKit Webhook Error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
