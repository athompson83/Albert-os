import { NextResponse } from 'next/server';
import { getHermesState } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  const conversations = getHermesState().chats;
  return NextResponse.json({
    conversations,
    total: conversations.length,
    byProject: conversations.reduce<Record<string, number>>((acc, chat) => {
      acc[chat.project] = (acc[chat.project] || 0) + 1;
      return acc;
    }, {}),
  });
}
