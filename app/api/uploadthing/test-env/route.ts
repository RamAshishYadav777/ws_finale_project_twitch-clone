import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        hasToken: !!process.env.UPLOADTHING_TOKEN,
        tokenLength: process.env.UPLOADTHING_TOKEN?.length || 0,
        tokenPreview: process.env.UPLOADTHING_TOKEN?.substring(0, 20) + "...",
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('UPLOAD')),
    });
}
