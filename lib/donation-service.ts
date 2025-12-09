
import { prisma as db } from "@/lib/db";

export const getStreamerTotalDonations = async (streamerId: string) => {
    try {
        const donations = await db.donation.aggregate({
            where: {
                streamerId,
                status: "success",
            },
            _sum: {
                amount: true,
            },
        });

        // Convert paise to rupees (100 paise = 1 INR)
        // If null, return 0
        return (donations._sum.amount || 0) / 100;
    } catch {
        return 0;
    }
};
