"use client";

import React, { useTransition } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DonationButton } from "@/components/donation-button";
import { cn } from "@/lib/utils";
import { onFollow, onUnfollow } from "@/actions/follow";
import { EditStreamModal } from "./edit-stream-modal";

export function Actions({
  hostIdentity,
  hostName,
  isFollowing,
  isHost,
  streamName,
  thumbnailUrl,
}: {
  hostIdentity: string;
  hostName: string;
  isFollowing: boolean;
  isHost: boolean;
  streamName?: string;
  thumbnailUrl?: string | null;
}) {
  const { userId } = useAuth();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    startTransition(() => {
      onFollow(hostIdentity)
        .then((data) =>
          toast.success(`You are now following ${data.following.username}.`)
        )
        .catch(() => toast.error("Something went wrong while following."));
    });
  };

  const handleUnfollow = () => {
    startTransition(() => {
      onUnfollow(hostIdentity)
        .then((data) =>
          toast.success(`You have unfollowed ${data.following.username}.`)
        )
        .catch(() => toast.error("Something went wrong while unfollowing."));
    });
  };

  const toggleFollow = () => {
    if (!userId) {
      return router.push("/sign-in");
    }

    if (isHost) return;

    if (isFollowing) {
      handleUnfollow();
    } else {
      handleFollow();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {isHost && (
        <EditStreamModal
          initialName={streamName || hostName}
          initialThumbnailUrl={thumbnailUrl || null}
        />
      )}
      <Button
        disabled={isPending || isHost}
        onClick={toggleFollow}
        variant="primary"
        size="sm"
        className="w-full lg:w-auto"
      >
        <Heart
          className={cn("h-4 w-4 mr-2", isFollowing ? "fill-white" : "fill-none")}
        />
        {isFollowing ? "Unfollow" : "Follow"}
      </Button>
      {!isHost && userId && (
        <DonationButton streamerId={hostIdentity} streamerName={hostName} />
      )}
    </div>
  );
}

export function ActionsSkeleton() {
  return <Skeleton className="h-10 w-full lg:w-24" />;
}
