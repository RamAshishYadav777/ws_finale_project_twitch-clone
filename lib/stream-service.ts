"use server";

import { prisma } from "@/lib/db";

export const getStreamByUserId = async (userId: string) => {
  const stream = await prisma.stream.findUnique({
    where: {
      userId,
    },
  });

  return stream;
};
