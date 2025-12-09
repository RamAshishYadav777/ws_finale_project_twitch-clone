import React from "react";
import { notFound } from "next/navigation";

import { getUserByUsername } from "@/lib/user-service";
import { isFollowingUser } from "@/lib/follow-service";
import { isBlockedByUser } from "@/lib/block-service";
import { getStreamerTotalDonations } from "@/lib/donation-service";
import { StreamPlayer } from "@/components/stream-player";

interface UserPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: UserPageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: "User not found",
    };
  }

  return {
    title: user.username,
    description: user.bio || `Watch ${user.username}'s stream on TwitchClone!`,
    openGraph: {
      title: `${user.username} - TwitchClone`,
      description: user.bio || `Watch ${user.username}'s live stream now.`,
      images: [
        {
          url: user.imageUrl,
          alt: user.username,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.username} - TwitchClone`,
      description: user.bio || `Watch ${user.username}'s live stream now.`,
      images: [user.imageUrl],
    },
  };
}

export default async function UserPage({
  params,
}: UserPageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user || !user.stream) notFound();

  const isFollowing = await isFollowingUser(user.id);
  const isBlocked = await isBlockedByUser(user.id);
  const totalDonations = await getStreamerTotalDonations(user.id);

  if (isBlocked) notFound();

  return (
    <StreamPlayer
      user={user}
      isFollowing={isFollowing}
      stream={user.stream}
      totalDonations={totalDonations}
    />
  );
}
