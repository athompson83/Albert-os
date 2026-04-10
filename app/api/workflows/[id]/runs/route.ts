import { NextRequest, NextResponse } from 'next/server';

const GW = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');
const H = { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const r = await fetch(GW + '/workflows/' + id + '/runs', { headers: H, signal: AbortSignal.timeout(10000) });
    return NextResponse.json(await r.json());
  } catch {
    return NextResponse.json({ runs: [] });
  }
}
