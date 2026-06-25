import { NextRequest, NextResponse } from 'next/server';
import { handleSlackConversation, postSlackMessage, verifySlackSignature } from '@/lib/slack';

export const runtime = 'nodejs';
export const maxDuration = 120;

type SlackEventBody = {
  type?: string;
  challenge?: string;
  event?: {
    type?: string;
    text?: string;
    user?: string;
    bot_id?: string;
    channel?: string;
  };
};

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

  const body = JSON.parse(rawBody) as SlackEventBody;

  if (body.type === 'url_verification' && body.challenge) {
    return new Response(body.challenge, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const event = body.event;
  if (event?.type === 'app_mention' && event.text && !event.bot_id) {
    const cleaned = event.text.replace(/<@[^>]+>/g, '').trim() || 'status';
    const reply = await handleSlackConversation(`Slack mention from ${event.user || 'unknown'}: ${cleaned}`, 'albert', 'Slack');
    if (event.channel) await postSlackMessage(event.channel, reply);
  }

  return NextResponse.json({ ok: true });
}
