import { createUploadthing, type FileRouter } from "uploadthing/next";

import { getSelf } from "@/lib/auth-service";
import { prisma } from "@/lib/db";

const uploadthing = createUploadthing();

export const ourFileRouter = {
  thumbnailUploader: uploadthing({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const self = await getSelf();

      if (!self?.id) {
        throw new Error("Unauthorized");
      }

      // ✅ Only pass what is needed (safe)
      return { userId: self.id };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      // ✅ Always use prisma
      await prisma.stream.update({
        where: {
          userId: metadata.userId,
        },
        data: {
          thumbnailUrl: file.url,
        },
      });

      return { fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
