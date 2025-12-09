"use server";

import { v4 } from "uuid";
import { AccessToken } from "livekit-server-sdk";

import { getSelf } from "@/lib/auth-service";
import { getUserById } from "@/lib/user-service";
import { isBlockedByUser } from "@/lib/block-service";

export const createViewerToken = async (hostId: string) => {
  // 1️⃣ Get logged-in user or fallback to guest
  const sessionUser = await getSelf().catch(() => null);

  let viewerId: string;
  let viewerName: string;

  if (sessionUser) {
    viewerId = sessionUser.id;
    viewerName = sessionUser.username;

    const hostIdentity = `host-${hostId}`;
    if (hostId === sessionUser.id) {
      viewerId = hostIdentity;
    }
  } else {
    viewerId = `guest-${v4()}`;
    viewerName = `guest#${Math.floor(Math.random() * 9999)}`;
  }

  // 2️⃣ Validate host
  const host = await getUserById(hostId);
  if (!host) throw new Error("Host not found");

  // 3️⃣ Validate block status
  const isBlocked = await isBlockedByUser(host.id);
  if (isBlocked) throw new Error("User is blocked");

  // 4️⃣ Build secure LiveKit token
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: viewerId,
      name: viewerName,
    }
  );

  token.addGrant({
    room: host.id, // room ID matches host.id
    roomJoin: true,
    canPublish: false, // viewers cannot publish video
    canPublishData: true, // viewers can send chat data
  });

  return token.toJwt();
};
