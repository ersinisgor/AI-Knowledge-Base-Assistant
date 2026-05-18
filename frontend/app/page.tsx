import { ChatArea } from '@/components/chat/chat-area';

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  return <ChatArea key={session ?? 'new'} sessionId={session} />;
}
