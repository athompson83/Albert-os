import { NextRequest, NextResponse } from 'next/server';
import { getHermesState, upsertAgent } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = getHermesState().agents.find(item => item.id === id);
  return agent ? NextResponse.json({ context: agent.context || '' }) : NextResponse.json({ error: 'Agent not found', content: '' }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const agent = upsertAgent({ id, context: String(body.context || body.value || '') });
  return NextResponse.json({ agent, context: agent.context || '' });
}
