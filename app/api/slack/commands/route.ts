import { NextRequest, NextResponse } from 'next/server';
import { handleSlackConversation, verifySlackSignature } from '@/lib/slack';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const verified = verifySlackSignature(
    rawBody,
    req.headers.get('x-slack-request-timestamp'),
    req.headers.get('x-slack-signature'),
  );

  if (!verified.ok) {
    return NextResponse.json({ error: 'Invalid Slack signature.' }, { status: 401 });
  }

  const form = new URLSearchParams(rawBody);
  const text = form.get('text')?.trim() || 'status';
  const user = form.get('user_name') || form.get('user_id') || 'Slack';
  const agentMatch = text.match(/^@?([a-z0-9_-]+)\s+(.+)/i);
  const agentId = agentMatch?.[1]?.toLowerCase() || 'albert';
  const message = agentMatch?.[2] || text;
  const reply = await handleSlackConversation(`${user}: ${message}`, agentId, 'Slack');

  return NextResponse.json({
    response_type: 'in_channel',
    text: reply,
  });
}
