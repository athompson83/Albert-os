import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

// Chat API — proxies to Hermes gateway
// Tries multiple gateway URLs in order of preference
async function tryGateway(message: string): Promise<string> {
  const gatewayUrls = [
    process.env.ALBERT_GATEWAY_URL,
    process.env.NEXT_PUBLIC_PROXY_URL,
    'http://localhost:3001',
    'https://legwork-brisket-anyplace.ngrok-free.dev',
  ].filter(Boolean) as string[];

  for (const baseUrl of gatewayUrls) {
    const url = `${baseUrl.replace(/\/+$/, '')}/agent`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ message, agentId: 'albert' }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json();
        const reply =
          data?.reply ||
          data?.payloads?.[0]?.text ||
          data?.message ||
          data?.text;
        if (reply) return reply;
      }
    } catch {
      // Try next URL
    }
  }

  throw new Error('No gateway available');
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  try {
    const reply = await tryGateway(message);
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      reply: `Gateway unavailable. The Hermes gateway needs to be running on port 3001. Error: ${msg.slice(0, 100)}`,
      error: true,
    });
  }
}
