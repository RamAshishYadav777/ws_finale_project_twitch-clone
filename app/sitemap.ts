import { MetadataRoute } from "next";

import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // const users = await prisma.user.findMany({
    //     select: {
    //         username: true,
    //         updatedAt: true,
    //     },
    // });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // const userEntries: MetadataRoute.Sitemap = users.map((user) => ({
    //     url: `${baseUrl}/${user.username}`,
    //     lastModified: user.updatedAt,
    //     changeFrequency: "daily",
    //     priority: 0.7,
    // }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        // ...userEntries,
    ];
}
