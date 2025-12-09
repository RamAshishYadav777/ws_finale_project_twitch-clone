import { createUploadthing, type FileRouter } from "uploadthing/next";

import { getSelf } from "@/lib/auth-service";
import { prisma } from "@/lib/db";

const uploadthing = createUploadthing({
  errorFormatter: (err) => {
    console.error("[UploadThing] Full Error Details:", JSON.stringify(err, null, 2));
    return {
      message: err.message,
    };
  },
});

export const ourFileRouter = {
  thumbnailUploader: uploadthing({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      try {
        const self = await getSelf();

        if (!self?.id) {
          console.error("[UploadThing] Unauthorized: No user found");
          throw new Error("Unauthorized");
        }

        console.log("[UploadThing] Middleware passed for user:", self.id);
        // ✅ Only pass what is needed (safe)
        return { userId: self.id };
      } catch (error) {
        console.error("[UploadThing] Middleware error:", error);
        throw error;
      }
    })
    .onUploadComplete(async ({ file, metadata }) => {
      try {
        console.log("[UploadThing] ===== Upload Complete =====");
        console.log("[UploadThing] File URL:", file.url);
        console.log("[UploadThing] User ID:", metadata.userId);
        console.log("[UploadThing] Metadata:", JSON.stringify(metadata));

        // Update DB here as well for consistency
        console.log("[UploadThing] Attempting database update...");
        const updatedStream = await prisma.stream.update({
          where: {
            userId: metadata.userId,
          },
          data: {
            thumbnailUrl: file.url,
          },
        });

        console.log("[UploadThing] Database updated successfully!");
        console.log("[UploadThing] Updated stream:", JSON.stringify(updatedStream));
        return { fileUrl: file.url };
      } catch (error) {
        console.error("[UploadThing] ===== ERROR IN onUploadComplete =====");
        console.error("[UploadThing] Error details:", error);
        console.error("[UploadThing] Error message:", error instanceof Error ? error.message : "Unknown error");
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
