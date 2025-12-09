import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const headerPayload = await headers();
        const signature = headerPayload.get("x-razorpay-signature");

        if (!signature) {
            console.error("❌ Missing Razorpay signature");
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 400 }
            );
        }

        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error("❌ Webhook secret not configured");
            return NextResponse.json(
                { error: "Webhook not configured" },
                { status: 500 }
            );
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("❌ Invalid webhook signature");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        const event = JSON.parse(body);
        console.log("🔔 Razorpay webhook event:", event.event);

        // Handle different webhook events
        switch (event.event) {
            case "payment.captured":
                await handlePaymentCaptured(event);
                break;

            case "payment.failed":
                await handlePaymentFailed(event);
                break;

            case "subscription.charged":
                await handleSubscriptionCharged(event);
                break;

            case "subscription.cancelled":
                await handleSubscriptionCancelled(event);
                break;

            default:
                console.log("ℹ️ Unhandled event type:", event.event);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("❌ Webhook processing failed:", error);
        return NextResponse.json(
            { error: error.message || "Webhook processing failed" },
            { status: 500 }
        );
    }
}

async function handlePaymentCaptured(event: any) {
    try {
        const payment = event.payload.payment.entity;
        console.log("💰 Payment captured:", payment.id);

        // Find donation by payment ID or order ID
        const donation = await prisma.donation.findFirst({
            where: {
                OR: [
                    { razorpayPaymentId: payment.id },
                    { razorpayOrderId: payment.order_id },
                ],
            },
            include: { streamer: true },
        });

        if (donation && donation.status !== "success") {
            await prisma.donation.update({
                where: { id: donation.id },
                data: {
                    status: "success",
                    razorpayPaymentId: payment.id,
                },
            });

            console.log("✅ Donation marked as success:", donation.id);

            // Revalidate paths
            if (donation.streamer.username) {
                revalidatePath(`/u/${donation.streamer.username}/donations`);
            }
        }
    } catch (error) {
        console.error("❌ Error handling payment.captured:", error);
    }
}

async function handlePaymentFailed(event: any) {
    try {
        const payment = event.payload.payment.entity;
        console.log("❌ Payment failed:", payment.id);

        const donation = await prisma.donation.findFirst({
            where: { razorpayOrderId: payment.order_id },
        });

        if (donation) {
            await prisma.donation.update({
                where: { id: donation.id },
                data: {
                    status: "failed",
                    razorpayPaymentId: payment.id,
                },
            });

            console.log("✅ Donation marked as failed:", donation.id);
        }
    } catch (error) {
        console.error("❌ Error handling payment.failed:", error);
    }
}

async function handleSubscriptionCharged(event: any) {
    try {
        const subscription = event.payload.subscription.entity;
        console.log("💳 Subscription charged:", subscription.id);

        // Update subscription in database
        await prisma.subscription.updateMany({
            where: { razorpaySubId: subscription.id },
            data: {
                status: "active",
                currentPeriodEnd: new Date(subscription.current_end * 1000),
            },
        });

        console.log("✅ Subscription updated");
    } catch (error) {
        console.error("❌ Error handling subscription.charged:", error);
    }
}

async function handleSubscriptionCancelled(event: any) {
    try {
        const subscription = event.payload.subscription.entity;
        console.log("🚫 Subscription cancelled:", subscription.id);

        await prisma.subscription.updateMany({
            where: { razorpaySubId: subscription.id },
            data: { status: "cancelled" },
        });

        console.log("✅ Subscription marked as cancelled");
    } catch (error) {
        console.error("❌ Error handling subscription.cancelled:", error);
    }
}
