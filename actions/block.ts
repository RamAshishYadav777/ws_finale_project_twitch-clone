"use server";

import { revalidatePath } from "next/cache";
import { RoomServiceClient } from "livekit-server-sdk";

import { blockUser, unblockUser } from "@/lib/block-service";
import { getSelf } from "@/lib/auth-service";

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_API_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export const onBlock = async (id: string) => {
  const self = await getSelf();

  if (!self?.id) {
    throw new Error("Unauthorized");
  }

  let blockedUser = null;

  try {
    blockedUser = await blockUser(id);
  } catch (err) {
    // user may be guest or already blocked
    console.warn("Block failed:", err);
  }

  try {
    // roomName = host.id, participantIdentity = viewer id
    await roomService.removeParticipant(self.id, id);
  } catch (err) {
    // user may not be connected to the room
    console.warn("LiveKit removeParticipant failed:", err);
  }

  revalidatePath(`/u/${self.username}/community`);

  return blockedUser;
};

export const onUnblock = async (id: string) => {
  const self = await getSelf();

  if (!self?.id) {
    throw new Error("Unauthorized");
  }

  const unblockedUser = await unblockUser(id);

  revalidatePath(`/u/${self.username}/community`);

  return unblockedUser;
};
