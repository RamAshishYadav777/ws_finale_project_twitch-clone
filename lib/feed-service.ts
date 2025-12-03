import { prisma } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export const getStreams = async () => {
  let userId: string | null = null;

  try {
    const self = await getSelf();
    userId = self?.id ?? null;
  } catch {
    userId = null;
  }

  if (userId) {
    return await prisma.stream.findMany({
      where: {
        user: {
          NOT: {
            blocking: {
              some: { blockedId: userId },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnailUrl: true,
        isLive: true,
        user: true,
      },
      orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
    });
  }

  return await prisma.stream.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      thumbnailUrl: true,
      isLive: true,
      user: true,
    },
    orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
  });
};
