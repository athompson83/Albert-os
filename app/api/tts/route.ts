import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  try {
    const { text, agentId = 'albert' } = await req.json();
    const res = await fetch(`${GATEWAY_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ text, agentId }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, { headers: { 'Content-Type': 'audio/mpeg' } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
