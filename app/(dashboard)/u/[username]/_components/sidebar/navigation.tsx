"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Fullscreen, KeyRound, MessagesSquare, Users } from "lucide-react";

import { NavItem, NavItemSkeleton } from "./nav-item";

export function Navigation({ totalDonations }: { totalDonations: number }) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  // ✅ 1. Wait for Clerk hydration
  if (!isLoaded) {
    return (
      <ul className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <NavItemSkeleton key={i} />
        ))}
      </ul>
    );
  }

  // ✅ 2. Safe username fallback (prevents infinite skeleton)
  const username = user?.username || user?.id;

  const routes = [
    {
      label: "Stream",
      href: `/u/${username}`,
      icon: Fullscreen,
    },
    {
      label: "Keys",
      href: `/u/${username}/keys`,
      icon: KeyRound,
    },
    {
      label: "Chat",
      href: `/u/${username}/chat`,
      icon: MessagesSquare,
    },
    {
      label: "Community",
      href: `/u/${username}/community`,
      icon: Users,
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-2 pt-4 lg:pt-0">
      <ul className="space-y-2 px-2">
        {routes.map((route) => (
          <NavItem
            key={route.href}
            {...route}
            isActive={pathname === route.href}
          />
        ))}
      </ul>
      <div className="px-2 mt-auto pb-4">
        <div className="rounded-lg bg-indigo-600/10 p-3 lg:p-4 border border-indigo-600/20 hidden lg:block">
          <h3 className="text-xs font-semibold text-indigo-400 mb-1">
            Total Rewards
          </h3>
          <p className="text-xl font-bold text-white">
            ₹{totalDonations.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Lifetime earnings
          </p>
        </div>
      </div>
    </div>
  );
}
