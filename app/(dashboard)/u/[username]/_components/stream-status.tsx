"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface StreamStatusProps {
    initialIsLive: boolean;
    username: string;
}

export function StreamStatus({ initialIsLive, username }: StreamStatusProps) {
    const [isLive, setIsLive] = useState(initialIsLive);
    const router = useRouter();

    useEffect(() => {
        // Poll for status updates every 5 seconds
        const interval = setInterval(() => {
            router.refresh();
        }, 5000);

        return () => clearInterval(interval);
    }, [router]);

    useEffect(() => {
        setIsLive(initialIsLive);
    }, [initialIsLive]);

    return (
        <div className="flex items-center gap-2">
            <div
                className={`h-3 w-3 rounded-full ${isLive
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-500"
                    }`}
            />
            <span className={`font-semibold ${isLive ? "text-green-500" : "text-gray-500"}`}>
                {isLive ? "LIVE" : "OFFLINE"}
            </span>
        </div>
    );
}
