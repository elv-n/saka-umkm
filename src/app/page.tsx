import { redirect } from "next/navigation";

import Chat from "@/app/_components/Chat";
import { getCurrentUser } from "@/lib/auth";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { tab } = await searchParams;

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Chat user={user} initialTab={tab} />
    </main>
  );
}
