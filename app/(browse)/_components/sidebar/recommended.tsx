"use client";

import React from "react";
import type { User } from "@prisma/client";

import { useSidebar } from "@/store/use-sidebar";
import { UserItem, UserItemSkeleton } from "./user-item";

// ✅ Explicit type for stream relation
interface RecommendedUser extends User {
  stream: {
    isLive: boolean;
  } | null;
}

export function Recommended({ data }: { data: RecommendedUser[] }) {
  const { collapsed } = useSidebar((state) => state);

  const showLabel = !collapsed;

  return (
    <div>
      {showLabel && (
        <div className="pl-6 mb-4">
          <p className="text-xs text-muted-foreground">Recommended</p>
        </div>
      )}

      <ul className="space-y-2 px-2">
        {data.map((user) => (
          <UserItem
            key={user.id}
            imageUrl={user.imageUrl}
            username={user.username}


            isLive={user.stream?.isLive ?? false}
          />
        ))}
      </ul>
    </div>
  );
}

export function RecommendedSkeleton() {
  return (
    <ul className="px-2">
      {[...Array(3)].map((_, i) => (
        <UserItemSkeleton key={i} />
      ))}
    </ul>
  );
}
