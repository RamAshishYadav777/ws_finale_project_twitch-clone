"use server";

import { revalidatePath } from "next/cache";

import { followUser, unfollowUser } from "@/lib/follow-service";
import { getSelf } from "@/lib/auth-service";

export const onFollow = async (id: string) => {
  const self = await getSelf();

  if (!self?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const followedUser = await followUser(id);

    revalidatePath("/");

    if (followedUser?.following?.username) {
      revalidatePath(`/${followedUser.following.username}`);
      revalidatePath(`/u/${followedUser.following.username}`);
    }

    return followedUser;
  } catch (error) {
    // ✅ SHOW THE REAL ERROR
    console.error("🔴 REAL onFollow ERROR:", error);
    throw error; // DO NOT HIDE IT
  }
};

export const onUnfollow = async (id: string) => {
  const self = await getSelf();

  if (!self?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const unfollowedUser = await unfollowUser(id);

    revalidatePath("/");

    if (unfollowedUser?.following?.username) {
      revalidatePath(`/${unfollowedUser.following.username}`);
      revalidatePath(`/u/${unfollowedUser.following.username}`);
    }

    return unfollowedUser;
  } catch (error) {
    console.error("🔴 REAL onUnfollow ERROR:", error);
    throw error;
  }
};
