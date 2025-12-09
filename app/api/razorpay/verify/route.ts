import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        console.log("🔍 Verifying payment:", razorpay_payment_id);

        // Verify signature
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keySecret) {
            throw new Error("Razorpay key secret not configured");
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", keySecret)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            console.error("❌ Invalid payment signature");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        // Update donation status
        const donation = await prisma.donation.update({
            where: { razorpayOrderId: razorpay_order_id },
            data: {
                status: "success",
                razorpayPaymentId: razorpay_payment_id,
            },
            include: {
                streamer: true,
            },
        });

        console.log("✅ Payment verified successfully");
        console.log("✅ Donation updated:", donation.id);
        console.log(`💰 ₹${donation.amount / 100} donated to ${donation.streamer.username}`);

        // Revalidate streamer's donation page
        if (donation.streamer.username) {
            revalidatePath(`/u/${donation.streamer.username}/donations`);
            revalidatePath(`/${donation.streamer.username}`);
        }

        return NextResponse.json({
            success: true,
            donationId: donation.id,
            amount: donation.amount,
        });
    } catch (error: any) {
        console.error("❌ Payment verification failed:", error);

        // Try to mark donation as failed
        try {
            if (error.code === "P2025") {
                // Donation not found
                return NextResponse.json(
                    { error: "Donation not found" },
                    { status: 404 }
                );
            }
        } catch (e) {
            // Ignore
        }

        return NextResponse.json(
            { error: error.message || "Verification failed" },
            { status: 500 }
        );
    }
}
