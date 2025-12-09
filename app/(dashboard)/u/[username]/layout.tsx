// app/(dashboard)/u/[username]/layout.tsx
import React from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getSelf } from "@/lib/auth-service";
import { getStreamerTotalDonations } from "@/lib/donation-service";
import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { Container } from "./_components/container";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  try {
    const self = await getSelf();

    if (!self) {
      redirect("/");
    }

    const totalDonations = await getStreamerTotalDonations(self.id);

    return (
      <>
        <Navbar />
        <div className="flex h-full pt-20">
          <Sidebar totalDonations={totalDonations} />
          <Container>{children}</Container>
        </div>
      </>
    );
  } catch {
    redirect("/");
  }
}
