import Image from "next/image";


import { cn } from "@/lib/utils";



export function Logo() {
  return (
    <div className="flex flex-col items-center gap-y-4">
      <div className="bg-black rounded-full p-1">
        <Image src="/twitch.gif" alt="GameHub" height="80" width="80" />
      </div>
      <div className={cn("flex flex-col items-center")}>
        <p className="text-xl font-semibold">Twitch</p>
        <p className="text-sm text-muted-foreground">Let&apos;s Play</p>
      </div>
    </div>
  );
}
