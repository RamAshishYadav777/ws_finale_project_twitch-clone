import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getSelfByUsername } from "@/lib/auth-service";
import { getStreams } from "@/lib/feed-service";

interface CreatorPageProps {
  params: {
    username: string;
  };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const externalUser = await currentUser();

  if (!externalUser) redirect("/sign-in");

  const user = await getSelfByUsername(params.username);

  if (!user || user.externalUserId !== externalUser.id || !user.stream) {
    redirect("/");
  }

  const streams = await getStreams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.username}</h1>

      <div className="space-y-4">
        {streams.map((stream) => (
          <div key={stream.id} className="rounded-md border p-4">
            <h2 className="font-semibold">{stream.name}</h2>
            <p className="text-sm text-muted-foreground">
              {stream.description || "No description"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
