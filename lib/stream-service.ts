"use server";

import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db";

export const getStreamByUserId = async (userId: string) => {
  // Prevent Next.js from caching this data - we need real-time stream status
  noStore();

  const stream = await prisma.stream.findUnique({
    where: {
      userId,
    },
  });

  return stream;
};
