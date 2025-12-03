import { prisma } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export const getSearch = async (term?: string) => {
  let userId: string | null = null;

  try {
    const self = await getSelf();
    userId = self?.id ?? null; // ✅ SAFE
  } catch {
    userId = null;
  }

  let streams = [];

  if (userId) {
    streams = await prisma.stream.findMany({
      where: {
        user: {
          NOT: {
            blocking: {
              some: {
                blockedId: userId,
              },
            },
          },
        },
        OR: [
          {
            name: {
              contains: term,
              mode: "insensitive", // ✅ better UX
            },
          },
          {
            user: {
              username: {
                contains: term,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      select: {
        user: true,
        id: true,
        name: true,
        isLive: true,
        thumbnailUrl: true,
        updatedAt: true,
      },
      orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
    });
  } else {
    streams = await prisma.stream.findMany({
      where: {
        OR: [
          {
            name: {
              contains: term,
              mode: "insensitive",
            },
          },
          {
            user: {
              username: {
                contains: term,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      select: {
        user: true,
        id: true,
        name: true,
        isLive: true,
        thumbnailUrl: true,
        updatedAt: true,
      },
      orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
    });
  }

  return streams;
};
