import { NextResponse } from "next/server";

export async function GET() {
    try {
        const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

        if (!razorpayKeyId) {
            return NextResponse.json(
                { error: "Razorpay not configured" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            keyId: razorpayKeyId,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to get config" },
            { status: 500 }
        );
    }
}
