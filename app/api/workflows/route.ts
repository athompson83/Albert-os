import { NextRequest, NextResponse } from 'next/server';
import { getHermesState, upsertWorkflow } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ workflows: getHermesState().workflows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const workflow = upsertWorkflow(body);
  return NextResponse.json({ workflow, workflows: getHermesState().workflows }, { status: 201 });
}
