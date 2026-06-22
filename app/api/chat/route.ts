import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  // The Hermes gateway doesn't expose a local HTTP API.
  // Chat works through messaging platforms (Slack, Discord, etc.)
  // For web chat, we need to either:
  // 1. Use the Hermes CLI in a subprocess (requires TTY)
  // 2. Set up a separate HTTP API server
  // 3. Use the messaging platform webhooks

  return NextResponse.json({
    reply: `I received your message: "${message}". The web chat feature requires the Hermes gateway HTTP API, which is not currently available. You can reach me through Slack (#hermes) or by talking to me directly in the terminal. I'm working autonomously and pushing updates to GitHub: https://github.com/athompson83/Albert-os`,
    error: true,
    needsGateway: true,
  });
}
