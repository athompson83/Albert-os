import { NextRequest, NextResponse } from 'next/server';
import { getHermesState, upsertWorkflow } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = getHermesState().workflows.find(item => item.id === id);
  return workflow ? NextResponse.json({ workflow }) : NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const workflow = upsertWorkflow({ ...body, id });
  return NextResponse.json({ workflow });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = getHermesState();
  state.workflows = state.workflows.filter(item => item.id !== id);
  return NextResponse.json({ ok: true, workflows: state.workflows });
}
