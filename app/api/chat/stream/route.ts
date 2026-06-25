import { NextRequest } from 'next/server';
import { createGatewayReply, recordChat } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';
export const maxDuration = 120;

type ChatAttachment = {
  name: string;
  url: string;
  type: string;
  size: number;
};

type StreamRequest = {
  message?: string;
  agentId?: string;
  attachments?: ChatAttachment[];
  project?: string;
};

function chunkText(text: string) {
  return text.match(/.{1,72}(?:\s|$)/g)?.filter(Boolean) || [text];
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as StreamRequest;
  const message = body.message?.trim();

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required.' }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send('status', { status: 'thinking', agentId: body.agentId || 'albert' });
        const reply = await createGatewayReply(message, body.agentId || 'albert');

        for (const part of chunkText(reply)) {
          send('token', { text: part });
          await new Promise(resolve => setTimeout(resolve, 18));
        }

        const chat = recordChat(message, reply, body.project || 'General', body.attachments);
        send('done', { reply, project: chat.project, gateway: 'builtin-hermes-http-api-stream' });
      } catch (error) {
        send('error', { message: error instanceof Error ? error.message : String(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
