import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const GATEWAY_URL = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  const { message, attachments = [], agentId = 'albert' } = await req.json();
  try {
    const res = await fetch(`${GATEWAY_URL}/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ message, attachments, agentId, deliver: false }),
      signal: AbortSignal.timeout(50000),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gateway ${res.status}: ${txt.slice(0, 200)}`);
    }

    const data = await res.json();
    const reply = data?.reply
      || data?.payloads?.[0]?.text
      || data?.message
      || data?.text
      || 'Got it.';

    return NextResponse.json({ reply, project: data?.project, domain: data?.domain });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Chat error:', msg);
    if (msg.includes('abort') || msg.includes('timeout') || msg.includes('TimeoutError') || msg.includes('ETIMEDOUT')) {
      return NextResponse.json({ reply: "Still thinking — complex question. Try again and I'll be faster. 🎩" });
    }
    return NextResponse.json({ reply: "I'm having a moment — try again in a sec. 🎩" });
  }
}
