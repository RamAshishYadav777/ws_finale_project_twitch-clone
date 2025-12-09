import React from "react";
import { getSelf } from "@/lib/auth-service";
import { getStreamByUserId } from "@/lib/stream-service";
import { StreamStatus } from "../_components/stream-status";

export default async function DebugPage() {
    const self = await getSelf();
    if (!self) {
        return <div className="p-6">Not authenticated</div>;
    }

    const stream = await getStreamByUserId(self.id);

    if (!stream) {
        return <div className="p-6">No stream found</div>;
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Stream Debug Info</h1>
                <StreamStatus initialIsLive={stream.isLive} username={self.username} />
            </div>

            <div className="bg-gray-900 p-4 rounded-lg space-y-2 font-mono text-sm">
                <div>
                    <span className="text-gray-400">Stream ID:</span>{" "}
                    <span className="text-white">{stream.id}</span>
                </div>
                <div>
                    <span className="text-gray-400">Ingress ID:</span>{" "}
                    <span className="text-white">{stream.ingressId || "NOT SET"}</span>
                </div>
                <div>
                    <span className="text-gray-400">Server URL:</span>{" "}
                    <span className="text-green-400">{stream.serverUrl || "NOT SET"}</span>
                </div>
                <div>
                    <span className="text-gray-400">Stream Key:</span>{" "}
                    <span className="text-yellow-400">
                        {stream.streamKey ? `${stream.streamKey.substring(0, 10)}...` : "NOT SET"}
                    </span>
                </div>
                <div>
                    <span className="text-gray-400">Is Live:</span>{" "}
                    <span className={stream.isLive ? "text-green-400" : "text-red-400"}>
                        {stream.isLive ? "YES ✅" : "NO ❌"}
                    </span>
                </div>
                <div>
                    <span className="text-gray-400">Chat Enabled:</span>{" "}
                    <span className="text-white">{stream.isChatEnabled ? "Yes" : "No"}</span>
                </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
                <h2 className="font-bold text-yellow-400 mb-2">OBS Configuration:</h2>
                <div className="space-y-2 font-mono text-sm">
                    <div>
                        <span className="text-gray-400">Server:</span>{" "}
                        <span className="text-white">{stream.serverUrl || "Generate connection first"}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">Stream Key:</span>{" "}
                        <span className="text-white">{stream.streamKey || "Generate connection first"}</span>
                    </div>
                </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
                <h2 className="font-bold text-blue-400 mb-2">Troubleshooting:</h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    {!stream.ingressId && (
                        <li className="text-red-400">⚠️ No ingress ID - Click &quot;Generate connection&quot; on Keys page</li>
                    )}
                    {!stream.isLive && stream.ingressId && (
                        <li className="text-yellow-400">
                            ⚠️ Stream not live - Check if OBS is streaming with correct URL/Key
                        </li>
                    )}
                    {stream.serverUrl?.includes("rtmps") && (
                        <li className="text-red-400">
                            ⚠️ Server URL uses RTMPS - should be RTMP (regenerate connection)
                        </li>
                    )}
                    {stream.isLive && (
                        <li className="text-green-400">✅ Stream is LIVE!</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
