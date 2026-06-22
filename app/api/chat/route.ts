import { NextRequest, NextResponse } from 'next/server';
import { createGatewayReply, recordChat } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';
export const maxDuration = 120;

type ChatAttachment = {
  name: string;
  url: string;
  type: string;
  size: number;
};

type ChatRequest = {
  message?: string;
  agentId?: string;
  attachments?: ChatAttachment[];
  project?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as ChatRequest;
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ reply: 'Message is required.', error: true }, { status: 400 });
  }

  const reply = await createGatewayReply(message, body.agentId || 'albert');
  const chat = recordChat(message, reply, body.project || 'General', body.attachments);

  return NextResponse.json({
    reply,
    project: chat.project,
    gateway: 'builtin-hermes-http-api',
  });
}
