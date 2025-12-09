import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        hasRazorpayKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasRazorpayKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        hasRazorpayWebhookSecret: !!process.env.RAZORPAY_WEBHOOK_SECRET,
        hasPublicKey: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        keyIdValue: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 15) + "..." : "NOT FOUND",
        allEnvKeys: Object.keys(process.env).filter(key => key.includes("RAZOR")).join(", ") || "NONE",
    });
}
