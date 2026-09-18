import { auth } from "@/auth";
import { ChatShell } from "@/components/chat/ChatShell";

export default async function ChatPage() {
  const session = await auth();
  return <ChatShell userName={session!.user!.name ?? session!.user!.email ?? "there"} />;
}
