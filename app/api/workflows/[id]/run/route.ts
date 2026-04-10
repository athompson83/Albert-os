import { NextRequest, NextResponse } from 'next/server';

const GW = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');
const H = { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const r = await fetch(GW + '/workflows/' + id + '/run', { method: 'POST', headers: H, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
    return NextResponse.json(await r.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
