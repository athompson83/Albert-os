import { NextRequest, NextResponse } from 'next/server';
import { logExchange } from '@/lib/exchange-log';
import { recordHermesEvent } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const message = String(body.message || body.feedback || '').trim();
  const agentId = String(body.agentId || 'albert');

  if (!message) {
    return NextResponse.json({ error: 'Feedback message is required.' }, { status: 400 });
  }

  const event = recordHermesEvent({
    type: 'status',
    title: 'Progress feedback from Adam',
    detail: message,
    entityId: typeof body.relatedId === 'string' ? body.relatedId : undefined,
  });

  const log = logExchange({
    source: 'web',
    direction: 'inbound',
    channel: 'progress',
    kind: 'progress_feedback',
    actor: 'Adam',
    targetAgentId: agentId,
    summary: message,
    relatedId: event.id,
    payload: body,
  });

  return NextResponse.json({ ok: true, event, log }, { status: 201 });
}
