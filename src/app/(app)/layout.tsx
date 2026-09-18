import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BottomNav } from "@/components/nav/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
