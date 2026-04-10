import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev';
const NGROK_HEADER = { 'ngrok-skip-browser-warning': 'true' };

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await req.json();
    const res = await fetch(`${GATEWAY_URL}/agents/${id}`, {
      method: 'PUT',
      headers: { ...NGROK_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await Promise.resolve(params);
    const res = await fetch(`${GATEWAY_URL}/agents/${id}`, {
      method: 'DELETE',
      headers: NGROK_HEADER,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
