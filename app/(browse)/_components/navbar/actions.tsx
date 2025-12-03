import React from "react";
import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { SignInButton, UserButton } from "@clerk/nextjs";


import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export async function Actions() {
  const user = await currentUser();

  let username: string | null = null;

  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: {
        externalUserId: user.id,
      },
      select: {
        username: true,
      },
    });

    username = dbUser?.username ?? null;
  }

  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      {!user && (
        <SignInButton>
          <Button variant="primary">Login</Button>
        </SignInButton>
      )}

      {!!user && username && (
        <div className="flex items-center gap-x-4">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-primary"
            asChild
          >
            <Link href={`/u/${username}`}>
              <Clapperboard className="h-5 w-5 lg:mr-2" />
              <span className="hidden lg:block">Dashboard</span>
            </Link>
          </Button>

          <UserButton afterSignOutUrl="/" />
        </div>
      )}
    </div>
  );
}
