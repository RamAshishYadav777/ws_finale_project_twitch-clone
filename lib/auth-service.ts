import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/* ======================================
   ✅ Get current logged-in user (auto-create)
====================================== */
export async function getSelf() {
  const externalUser = await currentUser();
  if (!externalUser) return null;

  let user = await prisma.user.findUnique({
    where: { externalUserId: externalUser.id },
    include: { stream: true },
  });

  if (user && !user.stream) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        stream: {
          create: {
            name: user.username,
          },
        },
      },
      include: { stream: true },
    });
  }

  // ✅ Auto-create user + stream if missing
  if (!user) {
    const username =
      externalUser.username ||
      externalUser.emailAddresses[0].emailAddress.split("@")[0];

    user = await prisma.user.create({
      data: {
        externalUserId: externalUser.id,
        username,

        // ✅ REQUIRED FIELD FIX
        imageUrl: externalUser.imageUrl,

        stream: {
          create: {
            name: username,
          },
        },
      },
      include: { stream: true },
    });
  }

  return user;
}

/* ======================================
   ✅ Get user by username (dashboard)
====================================== */
export async function getSelfByUsername(username: string) {
  const externalUser = await currentUser();
  if (!externalUser) return null;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      stream: true,
      _count: {
        select: {
          followedBy: true,
        },
      },
    },
  });

  if (!user) return null;

  // ✅ Only allow owner to access dashboard
  if (user.externalUserId !== externalUser.id) {
    return null;
  }

  return user;
}
