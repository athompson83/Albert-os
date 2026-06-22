import { NextRequest, NextResponse } from 'next/server';
import { upsertAgent } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let avatar = `/avatars/${id}.png`;
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    avatar = String(body.avatar || body.url || avatar);
  }

  const agent = upsertAgent({ id, avatar });
  return NextResponse.json({ agent, avatar });
}
