import { NextRequest, NextResponse } from 'next/server';
import { getHermesState, ingestHermesUpdate } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ events: getHermesState().events });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = ingestHermesUpdate(body);
  return NextResponse.json({ ok: true, result, events: getHermesState().events }, { status: 201 });
}
