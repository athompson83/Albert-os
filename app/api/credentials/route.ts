import { NextRequest, NextResponse } from 'next/server';
import { getHermesState, upsertCredential } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ credentials: getHermesState().credentials });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const credential = upsertCredential(body);
  return NextResponse.json({ credential, credentials: getHermesState().credentials }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const credential = upsertCredential(body);
  return NextResponse.json({ credential, credentials: getHermesState().credentials });
}
