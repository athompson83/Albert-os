import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');
const NGROK_HEADER = { 'ngrok-skip-browser-warning': 'true' };

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY_URL}/agents`, {
      headers: NGROK_HEADER,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error(`Agents proxy error ${res.status}:`, txt.slice(0, 200));
      return NextResponse.json({ error: `Upstream ${res.status}`, agents: [] }, { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('Agents fetch error:', String(err));
    return NextResponse.json({ error: String(err), agents: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${GATEWAY_URL}/agents`, {
      method: 'POST',
      headers: { ...NGROK_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
