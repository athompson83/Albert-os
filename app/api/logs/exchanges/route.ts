import { NextRequest, NextResponse } from 'next/server';
import { listExchangeLogs, logExchange } from '@/lib/exchange-log';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const logs = listExchangeLogs({
    date: searchParams.get('date') || undefined,
    source: searchParams.get('source') || undefined,
    kind: searchParams.get('kind') || undefined,
    search: searchParams.get('search') || undefined,
    limit: Number(searchParams.get('limit') || 200),
  });
  return NextResponse.json({
    logs,
    total: logs.length,
    generatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const entry = logExchange({
    source: body.source || 'web',
    direction: body.direction || 'inbound',
    channel: body.channel || 'manual',
    kind: body.kind || 'feedback',
    actor: body.actor || 'Adam',
    targetAgentId: body.targetAgentId || 'albert',
    summary: body.summary || body.message || 'Adam sent feedback.',
    relatedId: body.relatedId,
    payload: body.payload || body,
  });
  return NextResponse.json({ ok: true, entry }, { status: 201 });
}
