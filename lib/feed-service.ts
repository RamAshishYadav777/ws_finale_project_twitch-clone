import { prisma } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";
import { unstable_noStore as noStore } from "next/cache";

export const getStreams = async () => {
  noStore();
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
