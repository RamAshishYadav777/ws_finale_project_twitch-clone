import { NextResponse } from "next/server";
import { getSelf } from "@/lib/auth-service";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const self = await getSelf();

        if (!self) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const stream = await prisma.stream.findUnique({
            where: {
                userId: self.id,
            },
            select: {
                id: true,
                name: true,
                thumbnailUrl: true,
                userId: true,
            },
        });

        return NextResponse.json({
            user: {
                id: self.id,
                username: self.username,
            },
            stream: stream,
            hasThumbnail: !!stream?.thumbnailUrl,
            thumbnailUrl: stream?.thumbnailUrl,
        });
    } catch (error) {
        console.error("[Debug] Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
