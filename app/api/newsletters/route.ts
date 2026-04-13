import { NextResponse } from 'next/server';
const GW = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');
const H = { 'ngrok-skip-browser-warning': 'true' };
export async function GET() {
  try {
    const res = await fetch(`${GW}/newsletters`, { headers: H, signal: AbortSignal.timeout(5000) });
    return NextResponse.json(await res.json());
  } catch { return NextResponse.json({ newsletters: [] }); }
}
