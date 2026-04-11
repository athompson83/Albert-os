import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

// Proxy URL (ngrok tunnel → localhost:3001 → gateway)
// Falls back to env var or default ngrok URL
const PROXY_URL = (
  process.env.ALBERT_PROXY_URL ||
  process.env.ALBERT_GATEWAY_URL ||
  'https://legwork-brisket-anyplace.ngrok-free.dev'
).replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  const { message, attachments = [], agentId = 'albert' } = await req.json();

  try {
    const res = await fetch(`${PROXY_URL}/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ message, attachments, agentId }),
      signal: AbortSignal.timeout(55000),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Proxy ${res.status}: ${txt.slice(0, 200)}`);
    }

    const data = await res.json();
    const reply: string =
      data?.reply ||
      data?.payloads?.[0]?.text ||
      data?.message ||
      data?.text ||
      'Got it.';

    return NextResponse.json({ reply, project: data?.project, domain: data?.domain });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Chat API error:', msg);

    if (
      msg.includes('abort') ||
      msg.includes('timeout') ||
      msg.includes('TimeoutError') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('UND_ERR_HEADERS_TIMEOUT')
    ) {
      return NextResponse.json({
        reply: "Still thinking — give it another second and try again. 🎩",
      });
    }
    return NextResponse.json({
      reply: "Gateway hiccup — try again. 🎩",
    });
  }
}
