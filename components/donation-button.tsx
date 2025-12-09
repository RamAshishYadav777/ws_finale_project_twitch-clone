"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IndianRupee } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface DonationButtonProps {
    streamerId: string;
    streamerName: string;
}

export function DonationButton({ streamerId, streamerName }: DonationButtonProps) {
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const predefinedAmounts = [50, 100, 200, 500];

    const handleDonate = async () => {
        const donationAmount = parseInt(amount);

        if (!amount || donationAmount < 1) {
            toast.error("Please enter a valid amount (minimum ₹1)");
            return;
        }

        if (donationAmount > 100000) {
            toast.error("Maximum donation amount is ₹1,00,000");
            return;
        }

        setLoading(true);

        try {
            console.log("💰 Creating donation order for ₹" + donationAmount);

            // Create Razorpay order
            const res = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: donationAmount,
                    streamerId,
                    message: message.trim() || null,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create order");
            }

            const { orderId, amount: orderAmount, currency } = await res.json();
            console.log("✅ Order created:", orderId);

            // Check if Razorpay is loaded
            if (typeof window.Razorpay === "undefined") {
                toast.error("Payment gateway not loaded. Please refresh the page.");
                setLoading(false);
                return;
            }

            // Fetch Razorpay key from API
            console.log("🔑 Fetching Razorpay configuration...");
            const configRes = await fetch("/api/razorpay/config");

            if (!configRes.ok) {
                console.error("❌ Failed to fetch Razorpay config");
                toast.error("Payment system not configured. Please contact support.");
                setLoading(false);
                return;
            }

            const { keyId } = await configRes.json();
            console.log("✅ Razorpay key fetched:", keyId.substring(0, 15) + "...");

            // Initialize Razorpay checkout
            const options = {
                key: keyId,
                amount: orderAmount,
                currency: currency,
                name: "Twitch Clone",
                description: `Support ${streamerName}`,
                order_id: orderId,
                handler: async function (response: any) {
                    console.log("💳 Payment response received");

                    try {
                        // Verify payment
                        const verifyRes = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        if (verifyRes.ok) {
                            const data = await verifyRes.json();
                            console.log("✅ Payment verified:", data);

                            toast.success(
                                `Thank you! ₹${donationAmount} donated to ${streamerName}`,
                                { duration: 5000 }
                            );

                            setAmount("");
                            setMessage("");
                            setOpen(false);
                        } else {
                            const error = await verifyRes.json();
                            throw new Error(error.error || "Payment verification failed");
                        }
                    } catch (error: any) {
                        console.error("❌ Verification error:", error);
                        toast.error(error.message || "Payment verification failed");
                    }
                },
                prefill: {
                    name: "",
                    email: "",
                },
                theme: {
                    color: "#6366f1",
                },
                modal: {
                    ondismiss: function () {
                        console.log("ℹ️ Payment cancelled by user");
                        setLoading(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);

            rzp.on("payment.failed", function (response: any) {
                console.error("❌ Payment failed:", response.error);
                toast.error(
                    response.error.description || "Payment failed. Please try again."
                );
                setLoading(false);
            });

            rzp.open();
        } catch (error: any) {
            console.error("❌ Donation error:", error);
            toast.error(error.message || "Failed to process donation");
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="primary" size="sm">
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Donate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Support {streamerName}</DialogTitle>
                    <DialogDescription>
                        Show your appreciation with a donation
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Predefined amounts */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Quick Select
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {predefinedAmounts.map((amt) => (
                                <Button
                                    key={amt}
                                    type="button"
                                    variant={amount === amt.toString() ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => setAmount(amt.toString())}
                                    disabled={loading}
                                >
                                    ₹{amt}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Custom amount */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Amount (₹)
                        </label>
                        <Input
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            max="100000"
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Minimum: ₹1 • Maximum: ₹1,00,000
                        </p>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Message (Optional)
                        </label>
                        <Textarea
                            placeholder="Say something nice..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={200}
                            rows={3}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {message.length}/200 characters
                        </p>
                    </div>

                    {/* Donate button */}
                    <Button
                        onClick={handleDonate}
                        disabled={loading || !amount}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? "Processing..." : `Donate ₹${amount || "0"}`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
