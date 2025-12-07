import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { WebhookReceiver } from "livekit-server-sdk";

import { prisma } from "@/lib/db";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function GET() {
  return new Response("Webhook Endpoint Active", { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headerPayload = await headers();
    const authorization = headerPayload.get("Authorization");

    if (!authorization) {
      return new Response("Missing Authorization header", { status: 400 });
    }

    // ✅ Verify LiveKit signature
    const event = await receiver.receive(body, authorization);
    console.log("=".repeat(60));
    console.log("LiveKit Webhook Event:", event.event);
    console.log("Ingress ID:", event.ingressInfo?.ingressId);
    console.log("Room Name:", event.room?.name);
    console.log("Ingress Room Name:", event.ingressInfo?.roomName);
    console.log("Participant:", event.participant?.identity);
    console.log("Track:", event.track?.sid);
    console.log("Full Event:", JSON.stringify(event, null, 2));
    console.log("=".repeat(60));

    const ingressId = event.ingressInfo?.ingressId;

    if (!ingressId) {
      console.log("⚠️ No ingressId found, skipping database update");
      return new Response("OK - No ingressId", { status: 200 });
    }

    /* ===========================
       ✅ STREAM STARTED (Ingress)
    =========================== */
    if (event.event === "ingress_started") {
      console.log("Stream started for ingress:", ingressId);

      // ✅ Use userId (roomName) to update stream status
      // Priority: event.room.name -> event.ingressInfo.roomName -> ingressId
      const userId = event.room?.name || event.ingressInfo?.roomName;

      let stream;
      if (userId) {
        stream = await prisma.stream.update({
          where: { userId: userId },
          data: { isLive: true },
          include: { user: true },
        });
        console.log("Stream marked as live in DB (via userId:", userId, ")");
      } else {
        stream = await prisma.stream.update({
          where: { ingressId },
          data: { isLive: true },
          include: { user: true },
        });
        console.log("Stream marked as live in DB (via ingressId)");
      }

      // ✅ Revalidate path to show "Live" badge immediately
      if (stream?.user?.username) {
        revalidatePath(`/${stream.user.username}`);
        revalidatePath("/"); // Revalidate home page too
      }
    }

    /* ===========================
       ✅ STREAM STARTED (Participant Joined)
       Fallback if ingress_started is missed or delayed
    =========================== */
    if (event.event === "participant_joined") {
      console.log("Participant joined:", event.participant?.identity);

      // Only mark as live if the participant is the host (identity matches room name)
      if (event.room?.name && event.participant?.identity === event.room.name) {
        const userId = event.room.name;

        const stream = await prisma.stream.update({
          where: { userId: userId },
          data: { isLive: true },
          include: { user: true },
        });
        console.log("Stream marked as live in DB (via participant_joined)");

        if (stream?.user?.username) {
          revalidatePath(`/${stream.user.username}`);
          revalidatePath("/");
        }
      }
    }

    /* ===========================
       ✅ STREAM ENDED (Ingress)
    =========================== */
    if (event.event === "ingress_ended") {
      console.log("Stream ended for ingress:", ingressId);

      const userId = event.room?.name || event.ingressInfo?.roomName;

      let stream;
      if (userId) {
        stream = await prisma.stream.update({
          where: { userId: userId },
          data: { isLive: false },
          include: { user: true },
        });
        console.log("Stream marked as offline in DB (via userId:", userId, ")");
      } else {
        stream = await prisma.stream.update({
          where: { ingressId },
          data: { isLive: false },
          include: { user: true },
        });
        console.log("Stream marked as offline in DB (via ingressId)");
      }

      // ✅ Revalidate path to remove "Live" badge immediately
      if (stream?.user?.username) {
        revalidatePath(`/${stream.user.username}`);
        revalidatePath("/"); // Revalidate home page too
      }
    }

    /* ===========================
       ✅ STREAM ENDED (Participant Left)
       Fallback if ingress_ended is missed or delayed
    =========================== */
    if (event.event === "participant_left") {
      console.log("Participant left:", event.participant?.identity);

      if (event.room?.name && event.participant?.identity === event.room.name) {
        const userId = event.room.name;

        const stream = await prisma.stream.update({
          where: { userId: userId },
          data: { isLive: false },
          include: { user: true },
        });
        console.log("Stream marked as offline in DB (via participant_left)");

        if (stream?.user?.username) {
          revalidatePath(`/${stream.user.username}`);
          revalidatePath("/");
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ LiveKit Webhook Error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
