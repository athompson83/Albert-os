import { NextRequest, NextResponse } from 'next/server';
import { getHermesState, upsertTask } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ tasks: getHermesState().tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body._action === 'sync') {
    return NextResponse.json({ ok: true, tasks: getHermesState().tasks });
  }
  const task = upsertTask(body);
  return NextResponse.json({ task, tasks: getHermesState().tasks }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const task = upsertTask(body);
  return NextResponse.json({ task, tasks: getHermesState().tasks });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const state = getHermesState();
  state.tasks = state.tasks.map(task => (task.id === body.id ? { ...task, archivedAt: new Date().toISOString() } : task));
  return NextResponse.json({ ok: true, tasks: state.tasks });
}
