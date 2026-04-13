import { NextRequest, NextResponse } from 'next/server';
const GW = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');
const H = { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' };
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const res = await fetch(`${GW}/newsletter/save`, { method: 'POST', headers: H, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    return NextResponse.json(await res.json());
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
