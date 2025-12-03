"use server";

import type { User } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getSelf } from "@/lib/auth-service";
import { prisma } from "@/lib/db";

export const updateUser = async (values: Partial<User>) => {
  const self = await getSelf();

  if (!self?.id) {
    throw new Error("Unauthorized");
  }

  const validData = {
    bio: values.bio,
  };

  const user = await prisma.user.update({
    where: { id: self.id },
    data: validData,
  });

  revalidatePath(`/${self.username}`);
  revalidatePath(`/u/${self.username}`);

  return user;
};
