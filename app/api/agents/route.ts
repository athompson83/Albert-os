import { NextRequest, NextResponse } from 'next/server';
import { getHermesState, upsertAgent } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ agents: getHermesState().agents });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const agent = upsertAgent(body);
  return NextResponse.json({ agent }, { status: 201 });
}
