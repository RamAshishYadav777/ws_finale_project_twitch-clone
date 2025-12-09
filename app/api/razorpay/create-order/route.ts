import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getSelf } from "@/lib/auth-service";
import { prisma } from "@/lib/db";

const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    console.log("🔍 Checking Razorpay credentials:");
    console.log("  - RAZORPAY_KEY_ID:", keyId ? keyId.substring(0, 15) + "..." : "❌ NOT FOUND");
    console.log("  - RAZORPAY_KEY_SECRET:", keySecret ? "✅ Found" : "❌ NOT FOUND");
    console.log("  - All RAZOR env keys:", Object.keys(process.env).filter(k => k.includes("RAZOR")).join(", "));

    if (!keyId || !keySecret) {
        console.error("❌ Missing credentials - keyId:", !!keyId, "keySecret:", !!keySecret);
        throw new Error("Razorpay credentials not configured");
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

export async function POST(req: Request) {
    try {
        const self = await getSelf();

        if (!self) {
            return NextResponse.json(
                { error: "Unauthorized - Please sign in" },
                { status: 401 }
            );
        }

        const { amount, streamerId, message } = await req.json();

        // Validate amount
        if (!amount || amount < 1) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }

        // Validate streamer exists
        const streamer = await prisma.user.findUnique({
            where: { id: streamerId },
        });

        if (!streamer) {
            return NextResponse.json(
                { error: "Streamer not found" },
                { status: 404 }
            );
        }

        console.log("💰 Creating Razorpay order for ₹" + amount);

        const razorpay = getRazorpayInstance();

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: `donation_${Date.now()}`,
            notes: {
                streamerId,
                donorId: self.id,
                donorName: self.username,
            },
        });

        // Save donation to database
        const donation = await prisma.donation.create({
            data: {
                amount: amount * 100,
                currency: "INR",
                status: "pending",
                razorpayOrderId: order.id,
                streamerId,
                donorId: self.id,
                donorName: self.username,
                message: message || null,
            },
        });

        console.log("✅ Razorpay order created:", order.id);
        console.log("✅ Donation record created:", donation.id);

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            donationId: donation.id,
        });
    } catch (error: any) {
        console.error("❌ Razorpay order creation failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create order" },
            { status: 500 }
        );
    }
}
