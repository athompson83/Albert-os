import { createHmac, timingSafeEqual } from 'crypto';
import { createGatewayReply, recordChat, recordHermesEvent } from '@/lib/hermes-gateway';

export function verifySlackSignature(rawBody: string, timestamp: string | null, signature: string | null) {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return { ok: true, skipped: true };
  if (!timestamp || !signature) return { ok: false, skipped: false };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 60 * 5) {
    return { ok: false, skipped: false };
  }

  const base = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${createHmac('sha256', secret).update(base).digest('hex')}`;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length) return { ok: false, skipped: false };
  return { ok: timingSafeEqual(expectedBuffer, actualBuffer), skipped: false };
}

export async function handleSlackConversation(message: string, agentId = 'albert', project = 'Slack') {
  const reply = await createGatewayReply(message, agentId);
  recordChat(message, reply, project);
  recordHermesEvent({
    type: 'status',
    title: 'Slack conversation',
    detail: `${agentId} answered a Slack message.`,
  });
  return reply;
}

export async function postSlackMessage(channel: string, text: string) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || !channel) return { ok: false, skipped: true };

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel, text }),
  });
  return (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean; error?: string; skipped?: boolean };
}
