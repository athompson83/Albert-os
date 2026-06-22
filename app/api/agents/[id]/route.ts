import { NextRequest, NextResponse } from 'next/server';
import { getHermesState, upsertAgent } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = getHermesState().agents.find(item => item.id === id);
  return agent ? NextResponse.json({ agent }) : NextResponse.json({ error: 'Agent not found' }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const agent = upsertAgent({ ...body, id });
  return NextResponse.json({ agent });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return PUT(req, ctx);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = getHermesState();
  const before = state.agents.length;
  state.agents = state.agents.filter(item => item.id !== id || item.isDefault);
  return NextResponse.json({ ok: state.agents.length !== before });
}
