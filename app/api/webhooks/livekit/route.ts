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

    const ingressId = event.ingressInfo?.ingressId;

    if (!ingressId) {
      console.log("⚠️ No ingressId found, skipping database update");
      return new Response("OK - No ingressId", { status: 200 });
    }

    /* ===========================
       ✅ STREAM STARTED (Ingress)
    =========================== */
    if (event.event === "ingress_started") {
      console.log("🟢 Stream started for ingress:", ingressId);

      // ✅ Use userId (roomName) to update stream status
      // Priority: event.room.name -> event.ingressInfo.roomName -> ingressId
      const userId = event.room?.name || event.ingressInfo?.roomName;

      try {
        let stream;
        if (userId) {
          stream = await prisma.stream.update({
            where: { userId: userId },
            data: { isLive: true },
            include: { user: true },
          });
          console.log("✅ Stream marked as LIVE in DB (via userId:", userId, ")");
        } else {
          stream = await prisma.stream.update({
            where: { ingressId },
            data: { isLive: true },
            include: { user: true },
          });
          console.log("✅ Stream marked as LIVE in DB (via ingressId)");
        }

        // ✅ Revalidate paths to update UI immediately
        if (stream?.user?.username) {
          revalidatePath(`/${stream.user.username}`);
          revalidatePath("/");
          revalidatePath("/", "layout");
          revalidatePath(`/u/${stream.user.username}`);
          console.log("✅ Revalidated paths for:", stream.user.username);
        }
      } catch (error) {
        console.error("❌ Error updating stream to LIVE:", error);
        // Don't throw - return success to LiveKit to prevent retries
      }
    }

    /* ===========================
       ✅ STREAM STARTED (Participant Joined)
       Fallback if ingress_started is missed or delayed
    =========================== */
    if (event.event === "participant_joined") {
      console.log("👤 Participant joined:", event.participant?.identity);

      // Log matching check for debugging
      const isHost = event.room?.name && event.participant?.identity === event.room.name;
      console.log(`Checking host identity match: Room=${event.room?.name}, Participant=${event.participant?.identity}, Match=${isHost}`);

      // Only mark as live if the participant is the host (identity matches room name)
      if (isHost) {
        const userId = event.room!.name;

        try {
          const stream = await prisma.stream.update({
            where: { userId: userId },
            data: { isLive: true },
            include: { user: true },
          });
          console.log("✅ Stream marked as LIVE in DB (via participant_joined)");

          if (stream?.user?.username) {
            revalidatePath(`/${stream.user.username}`);
            revalidatePath("/");
            revalidatePath("/", "layout");
            revalidatePath(`/u/${stream.user.username}`);
            console.log("✅ Revalidated paths for:", stream.user.username);
          }
        } catch (error) {
          console.error("❌ Error updating stream to LIVE (participant_joined):", error);
        }
      }
    }

    /* ===========================
       ✅ STREAM ENDED (Ingress)
    =========================== */
    if (event.event === "ingress_ended") {
      console.log("🔴 Stream ended for ingress:", ingressId);

      const userId = event.room?.name || event.ingressInfo?.roomName;

      try {
        let stream;
        if (userId) {
          stream = await prisma.stream.update({
            where: { userId: userId },
            data: { isLive: false },
            include: { user: true },
          });
          console.log("✅ Stream marked as OFFLINE in DB (via userId:", userId, ")");
        } else {
          stream = await prisma.stream.update({
            where: { ingressId },
            data: { isLive: false },
            include: { user: true },
          });
          console.log("✅ Stream marked as OFFLINE in DB (via ingressId)");
        }

        // ✅ Revalidate paths to update UI immediately
        if (stream?.user?.username) {
          revalidatePath(`/${stream.user.username}`);
          revalidatePath("/");
          revalidatePath("/", "layout"); // Ensure sidebar updates
          revalidatePath(`/u/${stream.user.username}`);
          console.log("✅ Revalidated paths for:", stream.user.username);
        }
      } catch (error) {
        console.error("❌ Error updating stream to OFFLINE:", error);
        // Don't throw - return success to LiveKit to prevent retries
      }
    }

    /* ===========================
       ✅ STREAM ENDED (Participant Left)
       Fallback if ingress_ended is missed or delayed
    =========================== */
    if (event.event === "participant_left") {
      console.log("👋 Participant left:", event.participant?.identity);

      if (event.room?.name && event.participant?.identity === event.room.name) {
        const userId = event.room.name;

        try {
          const stream = await prisma.stream.update({
            where: { userId: userId },
            data: { isLive: false },
            include: { user: true },
          });
          console.log("✅ Stream marked as OFFLINE in DB (via participant_left)");

          if (stream?.user?.username) {
            revalidatePath(`/${stream.user.username}`);
            revalidatePath("/");
            revalidatePath("/", "layout");
            revalidatePath(`/u/${stream.user.username}`);
            console.log("✅ Revalidated paths for:", stream.user.username);
          }
        } catch (error) {
          console.error("❌ Error updating stream to OFFLINE (participant_left):", error);
        }
      }
    }

    /* ===========================
       ✅ STREAM ENDED (Room Finished)
       Final safety fallback if multiple participants leave or room closes
    =========================== */
    if (event.event === "room_finished") {
      console.log("🏁 Room finished:", event.room?.name);

      const userId = event.room?.name;

      if (userId) {
        try {
          // Check if stream exists first to avoid errors (room name might not be user ID in all future cases)
          // But our design assumes room name == user ID
          const stream = await prisma.stream.update({
            where: { userId: userId },
            data: { isLive: false },
            include: { user: true },
          });
          console.log("✅ Stream marked as OFFLINE in DB (via room_finished)");

          if (stream?.user?.username) {
            revalidatePath(`/${stream.user.username}`);
            revalidatePath("/");
            revalidatePath("/", "layout");
            revalidatePath(`/u/${stream.user.username}`);
            console.log("✅ Revalidated paths for:", stream.user.username);
          }
        } catch (error) {
          // It's possible the room name is not a user ID (unlikely in this app) or user deleted
          console.error("❌ Error updating stream to OFFLINE (room_finished):", error);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ LiveKit Webhook Error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
