import Image from "next/image";
import Link from "next/link";


import { cn } from "@/lib/utils";



export function Logo() {
  return (
    <Link href="/">
      <div className="flex items-center gap-x-4 hover:opacity-75 transition">
        <div className=" rounded-full p-1 mr-12 shrink-0 lg:mr-0 lg:shrink">
          <Image src="/twitch.gif" alt="GameHub" height="32" width="88" />
        </div>
        <div className={cn("hidden lg:block")}>
          <p className="text-lg font-semibold"></p>
          <p className="text-xs text-muted-foreground">Let&apos;s Play</p>
        </div>
      </div>
    </Link>
  );
}
