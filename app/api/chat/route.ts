import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // seconds — Vercel Pro allows up to 300s, hobby allows 60s

const GATEWAY_URL = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  const { message, attachments = [], agentId = 'albert' } = await req.json();
  try {
    // Call OpenClaw gateway agent endpoint via ngrok tunnel
    const res = await fetch(`${GATEWAY_URL}/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        message,
        attachments,
        agentId,
        deliver: false,
      }),
      signal: AbortSignal.timeout(55000),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gateway ${res.status}: ${txt.slice(0, 200)}`);
    }

    const data = await res.json();
    // Extract reply from OpenClaw response format
    const reply = data?.payloads?.[0]?.text
      || data?.reply
      || data?.message
      || data?.text
      || 'Got it.';

    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Gateway error:', msg);
    return NextResponse.json({ reply: "I'm having a moment — try again in a sec. 🎩" });
  }
}
