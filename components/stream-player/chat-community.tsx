"use client";

import React, { useMemo, useState } from "react";
import { useParticipants } from "@livekit/components-react";
import { useDebounceValue } from "usehooks-ts";
import { LocalParticipant, RemoteParticipant } from "livekit-client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CommunityItem } from "./community-item";

export function ChatCommunity({
  hostName,
  viewerName,
  isHidden,
  totalDonations,
}: {
  hostName: string;
  viewerName: string;
  isHidden: boolean;
  totalDonations: number;
}) {
  const [value, setValue] = useState("");
  const [debouncedValue] = useDebounceValue<string>(value, 500);

  const participants = useParticipants();

  const onChange = (newValue: string) => {
    setValue(newValue);
  };

  const filteredParticipants = useMemo(() => {
    // Filter out duplicate participants (e.g. if appear as both local and remote)
    // and match the search value
    const uniqueParticipants = Array.from(
      new Map(participants.map((p) => [p.identity, p])).values()
    );

    return uniqueParticipants.filter((participant) =>
      participant.name?.toLowerCase().includes(debouncedValue.toLowerCase())
    );
  }, [debouncedValue, participants]);

  if (isHidden) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Community is disabled</p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <Input
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search community"
        className="border-white/10"
      />
      <ScrollArea className="gap-y-2 mt-4 flex-1">
        <p className="text-center text-sm text-muted-foreground hidden last:block">
          No results
        </p>
        {filteredParticipants.map((participant) => (
          <CommunityItem
            key={participant.identity}
            hostName={hostName}
            viewerName={viewerName}
            participantName={participant.name}
            participantIdentity={participant.identity}
          />
        ))}
      </ScrollArea>
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="rounded-lg bg-indigo-600/10 p-4 border border-indigo-600/20">
          <h3 className="text-sm font-semibold text-indigo-400 mb-1">
            Total Community Rewards
          </h3>
          <p className="text-2xl font-bold text-white">
            ₹{totalDonations.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Donated by this amazing community!
          </p>
        </div>
      </div>
    </div>
  );
}
