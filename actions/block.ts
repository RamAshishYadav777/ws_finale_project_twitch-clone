"use server";

import { revalidatePath } from "next/cache";
import { RoomServiceClient } from "livekit-server-sdk";

import { blockUser, unblockUser } from "@/lib/block-service";
import { getSelf } from "@/lib/auth-service";

// Initialize RoomServiceClient with proper error handling
const getRoomService = () => {
  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiUrl || !apiKey || !apiSecret) {
    console.error("❌ LiveKit credentials missing:", {
      hasUrl: !!apiUrl,
      hasKey: !!apiKey,
      hasSecret: !!apiSecret,
    });
    throw new Error("LiveKit configuration is incomplete");
  }

  return new RoomServiceClient(apiUrl, apiKey, apiSecret);
};

export const onBlock = async (id: string) => {
  try {
    const self = await getSelf();

    if (!self?.id) {
      throw new Error("Unauthorized");
    }

    console.log("🚫 Attempting to block user:", id);

    let blockedUser = null;

    // Step 1: Block user in database
    try {
      blockedUser = await blockUser(id);
      console.log("✅ User blocked in database:", blockedUser?.blocked?.username || id);
    } catch (err: any) {
      console.error("❌ Database block failed:", err.message);
      // If user is already blocked or is a guest, continue to remove from room
      if (!err.message?.includes("already blocked")) {
        throw err;
      }
    }

    // Step 2: Remove participant from LiveKit room
    try {
      const roomService = getRoomService();
      // roomName = host.id (self.id), participantIdentity = viewer id
      await roomService.removeParticipant(self.id, id);
      console.log("✅ Participant removed from LiveKit room");
    } catch (err: any) {
      console.warn("⚠️ LiveKit removeParticipant failed:", err.message);
      // User may not be connected to the room - this is not a critical error
    }

    // Step 3: Revalidate all relevant paths
    revalidatePath(`/u/${self.username}/community`);
    revalidatePath(`/${self.username}`);
    revalidatePath("/");

    console.log("✅ Block action completed successfully");
    return blockedUser;
  } catch (error: any) {
    console.error("❌ Block action failed:", error.message);
    throw new Error(error.message || "Failed to block user");
  }
};

export const onUnblock = async (id: string) => {
  try {
    const self = await getSelf();

    if (!self?.id) {
      throw new Error("Unauthorized");
    }

    console.log("🔓 Attempting to unblock user:", id);

    const unblockedUser = await unblockUser(id);
    console.log("✅ User unblocked:", unblockedUser.blocked.username);

    // Revalidate all relevant paths
    revalidatePath(`/u/${self.username}/community`);
    revalidatePath(`/${self.username}`);
    revalidatePath("/");

    console.log("✅ Unblock action completed successfully");
    return unblockedUser;
  } catch (error: any) {
    console.error("❌ Unblock action failed:", error.message);
    throw new Error(error.message || "Failed to unblock user");
  }
};

