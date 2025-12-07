import Image from "next/image";
import Link from "next/link";


import { cn } from "@/lib/utils";



export function Logo() {
  return (
    <Link href="/">
      <div className="flex items-center gap-x-4 hover:opacity-75 transition">
        <div className="bg-black rounded-full p-1 mr-12 shrink-0 lg:mr-0 lg:shrink">
          <Image src="/twitch.gif" alt="Twitch" height="32" width="99" />
        </div>
        <div className={cn("hidden lg:block")}>
          <p className="text-lg font-semibold"></p>
          <p className="text-xs text-muted-foreground">Creator Dashboard</p>
        </div>
      </div>
    </Link>
  );
}
