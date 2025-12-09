"use client";

import React from "react";
import {
  useParticipants,
  useRemoteParticipant,
} from "@livekit/components-react";
import { User } from "lucide-react";

import { UserAvatar, UserAvatarSkeleton } from "@/components/user-avatar";
import { VerifiedMark } from "@/components/verified-mark";
import { Skeleton } from "@/components/ui/skeleton";

import { Actions, ActionsSkeleton } from "./actions";

export function Header({
  hostIdentity,
  hostName,
  imageUrl,
  isFollowing,
  name,
  viewerIdentity,
  thumbnailUrl,
}: {
  imageUrl: string;
  hostName: string;
  hostIdentity: string;
  viewerIdentity: string;
  isFollowing: boolean;
  name: string;
  thumbnailUrl: string | null;
}) {
  const participants = useParticipants();
  const participant = useRemoteParticipant(hostIdentity);

  const isLive = !!participant;
  const participantCount = participants.length - 1;

  const hostAsViewer = `host-${hostIdentity}`;
  const isHost = hostAsViewer === viewerIdentity;

  console.log("DEBUG HEADER:", { hostIdentity, viewerIdentity, isHost, hostAsViewer });

  return (
    <div className="flex flex-col lg:flex-row gap-y-4 lg:gap-y-0 items-start justify-between px-4">
      <div className="flex items-center gap-x-3">
        <UserAvatar
          imageUrl={imageUrl}
          username={hostName}
          size="lg"
          isLive={isLive}
          showBadge
        />
        <div className="space-y-1">
          <div className="flex items-center gap-x-2">
            <h2 className="text-lg font-semibold">{hostName}</h2>
            <VerifiedMark />
          </div>
          <p className="text-sm font-semibold">{name}</p>
          {isLive ? (
            <div className="font-semibold flex gap-x-1 items-center text-xs text-rose-500">
              <User className="h-4 w-4" />
              <p>
                {participantCount}{" "}
                {participantCount === 1 ? "viewer" : "viewers"}
              </p>
            </div>
          ) : (
            <p className="font-semibold text-xs text-muted-foreground">
              Offline
            </p>
          )}
        </div>
      </div>
      <Actions
        hostIdentity={hostIdentity}
        hostName={hostName}
        isFollowing={isFollowing}
        isHost={isHost}
        streamName={name}
        thumbnailUrl={thumbnailUrl}
      />
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-y-4 lg:gap-y-0 items-start justify-between px-4">
      <div className="flex items-center gap-x-2">
        <UserAvatarSkeleton size="lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <ActionsSkeleton />
    </div>
  );
}
