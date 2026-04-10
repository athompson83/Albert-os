import { NextRequest, NextResponse } from 'next/server';

const GW = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');
const H = { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' };

export async function GET() {
  try {
    const res = await fetch(`${GW}/tasks`, { headers: H, signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ tasks: [], error: 'Could not reach proxy' });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${GW}/tasks`, { method: 'POST', headers: H, body: JSON.stringify(body), signal: AbortSignal.timeout(6000) });
  return NextResponse.json(await res.json());
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${GW}/tasks`, { method: 'PATCH', headers: H, body: JSON.stringify(body), signal: AbortSignal.timeout(6000) });
  return NextResponse.json(await res.json());
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${GW}/tasks`, { method: 'DELETE', headers: H, body: JSON.stringify(body), signal: AbortSignal.timeout(6000) });
  return NextResponse.json(await res.json());
}
