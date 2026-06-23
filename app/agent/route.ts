import { NextRequest, NextResponse } from 'next/server';
import { createGatewayReply, recordChat } from '@/lib/hermes-gateway';
import { buildHermesManifest } from '@/lib/hermes-manifest';

export const runtime = 'nodejs';

export async function GET() {
  const manifest = buildHermesManifest();
  return NextResponse.json({
    ok: true,
    service: 'Albert Hermes HTTP API',
    endpoints: Object.values(manifest.endpoints),
    manifest: manifest.endpoints.manifest,
    health: manifest.endpoints.health,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const message = String(body.message || body.prompt || '').trim();
  const agentId = String(body.agentId || 'albert');

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const reply = await createGatewayReply(message, agentId);
  const chat = recordChat(message, reply, body.project || 'General', body.attachments);

  return NextResponse.json({
    reply,
    message: reply,
    text: reply,
    payloads: [{ type: 'text', text: reply }],
    project: chat.project,
    chat,
  });
}
