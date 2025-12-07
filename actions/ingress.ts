"use server";

import {
  IngressAudioEncodingPreset,
  IngressInput,
  IngressClient,
  IngressVideoEncodingPreset,
  RoomServiceClient,
  type CreateIngressOptions,
} from "livekit-server-sdk";
import { TrackSource } from "livekit-server-sdk/dist/proto/livekit_models";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

// ✅ Clients
const roomService = new RoomServiceClient(
  process.env.LIVEKIT_API_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const ingressClient = new IngressClient(
  process.env.LIVEKIT_API_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

// ✅ ONLY delete old ingresses — NEVER delete rooms
export const resetIngresses = async (hostId: string) => {
  const ingresses = await ingressClient.listIngress({ roomName: hostId });

  const rooms = await roomService.listRooms([hostId]);
  for (const room of rooms) {
    await roomService.deleteRoom(room.name);
  }

  for (const ingress of ingresses) {
    if (ingress.ingressId) {
      await ingressClient.deleteIngress(ingress.ingressId);
    }
  }
};

// ✅ MAIN FUNCTION — SAFE & STABLE
export const createIngress = async () => {
  const self = await getSelf();
  if (!self?.id) throw new Error("Unauthorized");

  // ✅ Remove only old ingresses
  await resetIngresses(self.id);

  // ✅ ENSURE ROOM EXISTS (CRITICAL FIX FOR "room disconnected")
  try {
    await roomService.createRoom({ name: self.id });
  } catch (err: any) {
    // Ignore "already exists" error
    if (!err?.message?.includes("already exists")) {
      console.error("❌ Room creation failed:", err);
      throw new Error("Room creation failed");
    }
  }

  const options: CreateIngressOptions = {
    name: self.username,
    roomName: self.id,
    participantName: self.username,
    participantIdentity: self.id,

    video: {
      source: TrackSource.CAMERA,
      preset: IngressVideoEncodingPreset.H264_720P_30FPS_3_LAYERS, // ✅ SDK-COMPATIBLE
    },

    audio: {
      source: TrackSource.MICROPHONE,
      preset: IngressAudioEncodingPreset.OPUS_STEREO_96KBPS,
    },
  };

  let ingress;
  try {
    ingress = await ingressClient.createIngress(
      IngressInput.RTMP_INPUT, // ✅ FORCE RTMP
      options
    );
    console.log("✅ LIVEKIT INGRESS RESPONSE:", ingress);
  } catch (err) {
    console.error("❌ LIVEKIT INGRESS ERROR:", err);
    throw new Error("LiveKit ingress creation failed");
  }

  if (!ingress?.url || !ingress.streamKey) {
    console.error("❌ INVALID INGRESS:", ingress);
    throw new Error("Ingress returned no URL or Stream Key");
  }

  // ✅ FORCE CORRECT RTMP FORMAT
  const rtmpUrl = ingress.url
    .replace("rtmps://", "rtmp://")
    .replace(/\/x$/, "/live");

  console.log("✅ FINAL RTMP URL SAVED:", rtmpUrl);

  // ✅ SAVE TO DATABASE
  await prisma.stream.update({
    where: { userId: self.id },
    data: {
      ingressId: ingress.ingressId,
      serverUrl: rtmpUrl,
      streamKey: ingress.streamKey,
    },
  });

  revalidatePath(`/u/${self.username}/keys`);

  return ingress;
};
