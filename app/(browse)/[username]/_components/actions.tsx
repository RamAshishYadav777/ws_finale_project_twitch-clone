"use client";

import React, { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { onFollow, onUnfollow } from "@/actions/follow";
import { onBlock, onUnblock } from "@/actions/block";

export function Actions({
  isFollowing,
  userId,
  isBlocked = false,
}: {
  isFollowing: boolean;
  userId: string;
  isBlocked?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [localIsBlocked, setLocalIsBlocked] = React.useState(isBlocked);

  const handleFollow = () => {
    startTransition(() => {
      onFollow(userId)
        .then((data) =>
          toast.success(`You are now following ${data.following.username}`)
        )
        .catch(() => toast.error("Something went wrong, failed to follow"));
    });
  };

  const handleUnfollow = () => {
    startTransition(() => {
      onUnfollow(userId)
        .then((data) =>
          toast.success(`You have unfollowed ${data.following.username}`)
        )
        .catch(() => toast.error("Something went wrong, failed to unfollow"));
    });
  };

  const handleBlock = () => {
    startTransition(() => {
      onBlock(userId)
        .then((data) => {
          setLocalIsBlocked(true);
          toast.success(
            data?.blocked?.username
              ? `Blocked ${data.blocked.username}`
              : "User blocked"
          );
        })
        .catch((err) => toast.error(err.message || "Failed to block user"));
    });
  };

  const handleUnblock = () => {
    startTransition(() => {
      onUnblock(userId)
        .then((data) => {
          setLocalIsBlocked(false);
          toast.success(`Unblocked ${data.blocked.username}`);
        })
        .catch((err) => toast.error(err.message || "Failed to unblock user"));
    });
  };

  const onClick = () => {
    if (isFollowing) {
      handleUnfollow();
    } else {
      handleFollow();
    }
  };

  return (
    <>
      <Button variant="primary" disabled={isPending || localIsBlocked} onClick={onClick}>
        {isFollowing ? "Unfollow" : "Follow"}
      </Button>
      {!localIsBlocked ? (
        <Button onClick={handleBlock} disabled={isPending} variant="destructive">
          Block
        </Button>
      ) : (
        <Button onClick={handleUnblock} disabled={isPending} variant="outline">
          Unblock
        </Button>
      )}
    </>
  );
}

