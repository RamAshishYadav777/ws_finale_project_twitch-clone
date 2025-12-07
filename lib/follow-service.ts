import { prisma } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export const getFollowedUsers = async () => {
  try {
    const self = await getSelf();

    if (!self) return [];

    const followedUsers = await prisma.follow.findMany({
      where: {
        followerId: self.id,
        following: {
          blocking: {
            none: {
              blockedId: self.id,
            },
          },
        },
      },
      include: {
        following: {
          include: {
            stream: {
              select: {
                isLive: true,
              },
            },
          },
        },
      },
    });

    return followedUsers;
  } catch {
    return [];
  }
};

export const isFollowingUser = async (id: string) => {
  try {
    const self = await getSelf();

    if (!self) return false;

    const otherUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!otherUser) return false;

    if (otherUser.id === self.id) return true;

    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: self.id,
        followingId: otherUser.id,
      },
    });

    return !!existingFollow;
  } catch {
    return false;
  }
};

export const followUser = async (id: string) => {
  const self = await getSelf();

  if (!self) {
    throw new Error("Unauthorized");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  if (otherUser.id === self.id) {
    throw new Error("You can't follow yourself");
  }

  const existingFollow = await prisma.follow.findFirst({
    where: {
      followerId: self.id,
      followingId: otherUser.id,
    },
  });

  if (existingFollow) {
    throw new Error("You are already following this user");
  }

  const follow = await prisma.follow.create({
    data: {
      followerId: self.id,
      followingId: otherUser.id,
    },
    include: {
      follower: true,
      following: true,
    },
  });

  return follow;
};

export const unfollowUser = async (id: string) => {
  const self = await getSelf();

  if (!self) {
    throw new Error("Unauthorized");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  if (otherUser.id === self.id) {
    throw new Error("You can't unfollow yourself");
  }

  const existingFollow = await prisma.follow.findFirst({
    where: {
      followerId: self.id,
      followingId: otherUser.id,
    },
  });

  if (!existingFollow) {
    throw new Error("You are not following this user");
  }

  const follow = await prisma.follow.delete({
    where: {
      id: existingFollow.id,
    },
    include: {
      following: true,
    },
  });

  return follow;
};
