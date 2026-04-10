import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');
const NGROK_HEADER = { 'ngrok-skip-browser-warning': 'true' };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const form = await req.formData();
    const res = await fetch(`${GATEWAY_URL}/agents/${id}/avatar`, {
      method: 'POST',
      headers: NGROK_HEADER,
      body: form,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
