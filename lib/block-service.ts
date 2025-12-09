"use server";

import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export const isBlockedByUser = async (id: string) => {
  try {
    const self = await getSelf();

    if (!self) return false;

    const otherUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!otherUser) return false;

    if (otherUser.id === self.id) return false;

    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: otherUser.id,
          blockedId: self.id,
        },
      },
    });

    return !!existingBlock;
  } catch {
    return false;
  }
};

export const blockUser = async (id: string) => {
  // Prevent caching for real-time block status
  noStore();

  const self = await getSelf();

  if (!self) {
    throw new Error("Unauthorized - Please sign in");
  }

  if (self.id === id) {
    throw new Error("Cannot block yourself");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  const existingBlock = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: self.id,
        blockedId: otherUser.id,
      },
    },
  });

  if (existingBlock) {
    throw new Error("User is already blocked");
  }

  // Also check if we're following them and unfollow
  try {
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: self.id,
          followingId: otherUser.id,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          id: existingFollow.id,
        },
      });
      console.log("✅ Unfollowed user before blocking");
    }
  } catch (error) {
    console.warn("⚠️ Could not unfollow user:", error);
    // Continue with blocking even if unfollow fails
  }

  const block = await prisma.block.create({
    data: {
      blockerId: self.id,
      blockedId: otherUser.id,
    },
    include: {
      blocked: true,
    },
  });

  return block;
};

export const unblockUser = async (id: string) => {
  // Prevent caching for real-time block status
  noStore();

  const self = await getSelf();

  if (!self) {
    throw new Error("Unauthorized - Please sign in");
  }

  if (self.id === id) {
    throw new Error("Cannot unblock yourself");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  const existingBlock = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: self.id,
        blockedId: otherUser.id,
      },
    },
  });

  if (!existingBlock) {
    throw new Error("User is not blocked");
  }

  const unblock = await prisma.block.delete({
    where: {
      id: existingBlock.id,
    },
    include: {
      blocked: true,
    },
  });

  return unblock;
};

export const getBlockedUsers = async () => {
  // Prevent caching for real-time block list
  noStore();

  const self = await getSelf();

  if (!self) {
    throw new Error("Unauthorized - Please sign in");
  }

  const blockedUsers = await prisma.block.findMany({
    where: {
      blockerId: self.id,
    },
    include: {
      blocked: true,
    },
  });

  return blockedUsers;
};
