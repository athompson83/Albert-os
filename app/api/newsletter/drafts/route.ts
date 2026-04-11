import { NextResponse } from 'next/server';

const GW = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');
const H = { 'ngrok-skip-browser-warning': 'true' };

export async function GET() {
  try {
    const res = await fetch(`${GW}/newsletter/drafts`, { headers: H, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Proxy ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ drafts: [], error: String(e) });
  }
}
