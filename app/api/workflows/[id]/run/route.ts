import { NextRequest, NextResponse } from 'next/server';
import { runWorkflow } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const run = runWorkflow(id, body);
  return run ? NextResponse.json({ success: true, run, outputs: run.outputs }) : NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 });
}
