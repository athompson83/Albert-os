import { NextRequest, NextResponse } from 'next/server';

const GW = process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev';
const H = { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const r = await fetch(GW + '/workflows/' + id, { headers: H, signal: AbortSignal.timeout(10000) });
    return NextResponse.json(await r.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const r = await fetch(GW + '/workflows/' + id, { method: 'PUT', headers: H, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    return NextResponse.json(await r.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const r = await fetch(GW + '/workflows/' + id, { method: 'DELETE', headers: H, signal: AbortSignal.timeout(10000) });
    return NextResponse.json(await r.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
