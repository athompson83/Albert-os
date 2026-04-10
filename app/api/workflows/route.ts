import { NextRequest, NextResponse } from 'next/server';

const GW = process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev';
const H = { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' };

export async function GET() {
  try {
    const r = await fetch(GW + '/workflows', { headers: H, signal: AbortSignal.timeout(10000) });
    return NextResponse.json(await r.json());
  } catch {
    return NextResponse.json({ workflows: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const r = await fetch(GW + '/workflows', { method: 'POST', headers: H, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    return NextResponse.json(await r.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
